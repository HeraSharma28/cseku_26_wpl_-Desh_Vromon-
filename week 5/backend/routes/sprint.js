const express = require('express');
const path = require('path');
const fs = require('fs');
const { analyze, toMarkdown, loadBoard } = require('../scripts/sprint-velocity');

const router = express.Router();

// GET /api/sprint/velocity — metrics + AI backlog recommendations
router.get('/velocity', (req, res) => {
  try {
    const report = analyze();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not compute sprint velocity.' });
  }
});

// GET /api/sprint/board — raw board
router.get('/board', (req, res) => {
  try {
    res.json(loadBoard());
  } catch (err) {
    res.status(500).json({ message: 'Could not load sprint board.' });
  }
});

// GET /api/sprint/report.md — markdown report
router.get('/report.md', (req, res) => {
  try {
    const report = analyze();
    const md = toMarkdown(report);
    res.type('text/markdown').send(md);
  } catch (err) {
    res.status(500).json({ message: 'Could not generate report.' });
  }
});

// POST /api/sprint/tasks/:id/status — update task status (simple board ops)
router.patch('/tasks/:id/status', (req, res) => {
  try {
    const boardPath = path.join(__dirname, '..', 'data', 'sprint-board.json');
    const board = loadBoard();
    const task = board.tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const { status, sprintId } = req.body;
    if (status) {
      if (!['todo', 'in-progress', 'done'].includes(status)) {
        return res.status(400).json({ message: 'Status must be todo, in-progress, or done.' });
      }
      task.status = status;
    }
    if (sprintId !== undefined) task.sprintId = sprintId;
    fs.writeFileSync(boardPath, JSON.stringify(board, null, 2));
    res.json({ task, velocity: analyze() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update task.' });
  }
});

module.exports = router;
