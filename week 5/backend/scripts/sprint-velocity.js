/**
 * AI-assisted sprint velocity monitor & backlog advisor
 * Run: node scripts/sprint-velocity.js
 * Also exposed via GET /api/sprint/velocity
 */
const fs = require('fs');
const path = require('path');

const BOARD_PATH = path.join(__dirname, '..', 'data', 'sprint-board.json');

function loadBoard() {
  return JSON.parse(fs.readFileSync(BOARD_PATH, 'utf8'));
}

function sumPoints(tasks) {
  return tasks.reduce((s, t) => s + (Number(t.points) || 0), 0);
}

function analyze(board = loadBoard()) {
  const bySprint = board.sprints.map((sprint) => {
    const tasks = board.tasks.filter((t) => t.sprintId === sprint.id);
    const done = tasks.filter((t) => t.status === 'done');
    const inProgress = tasks.filter((t) => t.status === 'in-progress');
    const todo = tasks.filter((t) => t.status === 'todo' || t.status === 'backlog');
    const committed = sumPoints(tasks);
    const completed = sumPoints(done);
    const velocity = completed;
    const completionRate = committed ? Math.round((completed / committed) * 100) : 0;
    const capacity = sprint.capacityPoints || committed || 1;
    const utilization = Math.round((committed / capacity) * 100);
    return {
      sprintId: sprint.id,
      name: sprint.name,
      start: sprint.start,
      end: sprint.end,
      goal: sprint.goal,
      capacityPoints: capacity,
      committedPoints: committed,
      completedPoints: completed,
      remainingPoints: sumPoints(inProgress) + sumPoints(todo.filter((t) => t.sprintId === sprint.id)),
      velocity,
      completionRate,
      utilization,
      taskCounts: {
        total: tasks.length,
        done: done.length,
        inProgress: inProgress.length,
        todo: todo.length
      }
    };
  });

  const completedSprints = bySprint.filter((s) => s.completedPoints > 0 && s.end < new Date().toISOString().slice(0, 10) || s.completionRate >= 80);
  const velocities = bySprint.filter((s) => s.completedPoints > 0).map((s) => s.velocity);
  const avgVelocity = velocities.length
    ? Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length)
    : 0;

  const backlog = board.tasks.filter((t) => t.status === 'todo' && (!t.sprintId || t.sprintId === 'sprint-3' || t.sprintId === null));
  const unscheduled = board.tasks.filter((t) => t.status === 'todo' && !t.sprintId);

  // AI-style backlog suggestions based on velocity + priority + capacity
  const nextSprint = board.sprints.find((s) => s.id === 'sprint-3') || board.sprints[board.sprints.length - 1];
  const nextCapacity = nextSprint?.capacityPoints || avgVelocity || 40;
  const targetCommit = Math.min(nextCapacity, Math.max(avgVelocity || 30, Math.round((avgVelocity || 30) * 0.9)));

  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const ranked = [...backlog]
    .map((t) => ({
      ...t,
      score: (priorityWeight[t.priority] || 1) * 10 + (t.points <= 5 ? 3 : 0) - (t.points > 8 ? 2 : 0)
    }))
    .sort((a, b) => b.score - a.score);

  const suggestedPull = [];
  let pulled = 0;
  for (const t of ranked) {
    if (pulled + t.points > targetCommit) continue;
    suggestedPull.push({
      id: t.id,
      title: t.title,
      points: t.points,
      priority: t.priority || 'medium',
      area: t.area,
      reason: suggestReason(t, avgVelocity)
    });
    pulled += t.points;
  }

  const deferred = ranked
    .filter((t) => !suggestedPull.find((s) => s.id === t.id))
    .map((t) => ({
      id: t.id,
      title: t.title,
      points: t.points,
      priority: t.priority || 'medium',
      reason: t.points > targetCommit - pulled
        ? 'Exceeds remaining capacity — split or move to later sprint'
        : 'Lower priority relative to velocity budget'
    }));

  const insights = buildInsights(bySprint, avgVelocity, nextCapacity, suggestedPull, deferred);

  return {
    project: board.project,
    generatedAt: new Date().toISOString(),
    averageVelocity: avgVelocity,
    sprints: bySprint,
    backlog: {
      unscheduledCount: unscheduled.length,
      unscheduledPoints: sumPoints(unscheduled),
      totalTodoPoints: sumPoints(backlog)
    },
    recommendations: {
      nextSprintId: nextSprint?.id,
      nextSprintName: nextSprint?.name,
      suggestedCapacity: nextCapacity,
      suggestedCommitPoints: targetCommit,
      pullIntoNextSprint: suggestedPull,
      deferOrSplit: deferred,
      insights
    }
  };
}

function suggestReason(task, avgVelocity) {
  if (task.priority === 'high') return 'High priority for launch readiness; fits recent velocity pattern';
  if (task.points <= 3) return 'Small item — good for filling remaining capacity without risk';
  if (task.area === 'tests') return 'Protects quality after rapid feature delivery';
  if (task.area === 'devops') return 'Unblocks demo/deployment for stakeholders';
  if (avgVelocity && task.points > avgVelocity * 0.4) return 'Large item — consider splitting if sprint slips';
  return 'Balanced value vs effort for the next sprint';
}

function buildInsights(bySprint, avgVelocity, nextCapacity, pull, deferred) {
  const insights = [];
  const s1 = bySprint.find((s) => s.sprintId === 'sprint-1');
  const s2 = bySprint.find((s) => s.sprintId === 'sprint-2');

  if (s1 && s2) {
    const delta = s2.velocity - s1.velocity;
    if (delta > 0) {
      insights.push(`Velocity increased from ${s1.velocity} → ${s2.velocity} pts (${delta > 0 ? '+' : ''}${delta}). Team is accelerating after foundation work.`);
    } else if (delta < 0) {
      insights.push(`Velocity dipped from ${s1.velocity} → ${s2.velocity} pts. Consider reducing WIP and protecting focus time.`);
    } else {
      insights.push(`Velocity stable at ${s2.velocity} pts across the last two sprints.`);
    }
  }

  if (s2 && s2.utilization > 110) {
    insights.push(`Sprint 2 was over-committed (${s2.utilization}% of capacity). Next sprint commit should stay near ${Math.round(nextCapacity * 0.9)} pts.`);
  } else if (s2 && s2.utilization < 70) {
    insights.push(`Sprint 2 under-utilized capacity (${s2.utilization}%). Safe to pull 1–2 extra small backlog items.`);
  }

  insights.push(`Recommended next-sprint commit: ~${pull.reduce((s, t) => s + t.points, 0)} pts (target ${Math.min(nextCapacity, avgVelocity || nextCapacity)} based on average velocity ${avgVelocity || 'n/a'}).`);

  if (deferred.length) {
    insights.push(`${deferred.length} item(s) should stay in backlog or be split — do not force them into the next sprint.`);
  }

  const highLeft = deferred.filter((d) => d.priority === 'high');
  if (highLeft.length) {
    insights.push(`Warning: high-priority items still deferred (${highLeft.map((h) => h.id).join(', ')}). Split them so part can land next sprint.`);
  }

  return insights;
}

function toMarkdown(report) {
  const lines = [];
  lines.push(`# Sprint Velocity Report — ${report.project}`);
  lines.push('');
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push(`**Average velocity:** ${report.averageVelocity} story points / sprint`);
  lines.push('');
  lines.push('## Sprint metrics');
  lines.push('');
  lines.push('| Sprint | Capacity | Committed | Completed (velocity) | Completion % | Utilization |');
  lines.push('|--------|----------|-----------|----------------------|--------------|-------------|');
  for (const s of report.sprints) {
    lines.push(`| ${s.name} | ${s.capacityPoints} | ${s.committedPoints} | **${s.completedPoints}** | ${s.completionRate}% | ${s.utilization}% |`);
  }
  lines.push('');
  lines.push('## Backlog snapshot');
  lines.push('');
  lines.push(`- Unscheduled items: ${report.backlog.unscheduledCount} (${report.backlog.unscheduledPoints} pts)`);
  lines.push(`- Total todo points (incl. next sprint pool): ${report.backlog.totalTodoPoints}`);
  lines.push('');
  lines.push(`## Recommended pull into ${report.recommendations.nextSprintName || 'next sprint'}`);
  lines.push('');
  lines.push(`Target commit: **${report.recommendations.suggestedCommitPoints} pts** (capacity ${report.recommendations.suggestedCapacity})`);
  lines.push('');
  for (const t of report.recommendations.pullIntoNextSprint) {
    lines.push(`- **${t.id}** (${t.points} pts, ${t.priority}) — ${t.title}`);
    lines.push(`  - _${t.reason}_`);
  }
  lines.push('');
  lines.push('## Defer / split');
  lines.push('');
  for (const t of report.recommendations.deferOrSplit) {
    lines.push(`- **${t.id}** (${t.points} pts, ${t.priority}) — ${t.title}: ${t.reason}`);
  }
  lines.push('');
  lines.push('## AI insights');
  lines.push('');
  for (const i of report.recommendations.insights) {
    lines.push(`- ${i}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('_Generated by `backend/scripts/sprint-velocity.js` · also available at `GET /api/sprint/velocity`_');
  return lines.join('\n');
}

if (require.main === module) {
  const report = analyze();
  const md = toMarkdown(report);
  const outMd = path.join(__dirname, '..', '..', 'SPRINT_VELOCITY_REPORT.md');
  fs.writeFileSync(outMd, md);
  console.log(md);
  console.log('\nWrote', outMd);
}

module.exports = { analyze, toMarkdown, loadBoard };
