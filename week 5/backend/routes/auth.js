const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    emailVerified: !!user.emailVerified
  };
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Demo email delivery: log to server console. Real SMTP can be plugged in later. */
function deliverOtpEmail(email, otp, name) {
  console.log('\n========== Desh Vromon OTP ==========');
  console.log(`To: ${email}`);
  console.log(`Name: ${name || 'User'}`);
  console.log(`OTP: ${otp}`);
  console.log('Valid for 10 minutes');
  console.log('=====================================\n');
  return true;
}

function setUserOtp(user) {
  const otp = generateOtp();
  user.otpCode = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  return otp;
}

// POST /auth/signup — create account, send OTP (no token until verified)
router.post('/signup', async (req, res) => {
  try {
    let { name, email, password, role } = req.body;
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.emailVerified) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }
      // Unverified account — refresh OTP and allow retry
      const hashed = await bcrypt.hash(password, 10);
      existing.name = name;
      existing.password = hashed;
      existing.role = role === 'provider' ? 'provider' : 'traveler';
      const otp = setUserOtp(existing);
      await existing.save();
      deliverOtpEmail(email, otp, name);
      return res.status(200).json({
        requiresVerification: true,
        email,
        message: 'Account pending verification. Enter the OTP sent to your email.',
        // Dev helper so UI works without a real mailbox
        devOtp: process.env.NODE_ENV === 'production' ? undefined : otp
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashed,
      role: role === 'provider' ? 'provider' : 'traveler',
      emailVerified: false
    });
    const otp = setUserOtp(user);
    await user.save();
    deliverOtpEmail(email, otp, name);

    res.status(201).json({
      requiresVerification: true,
      email,
      message: 'Account created. Enter the OTP sent to your email to verify.',
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while creating the account.' });
  }
});

// POST /auth/verify-otp — { email, otp }
router.post('/verify-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = (email || '').trim().toLowerCase();
    otp = String(otp || '').trim();
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found for this email.' });
    if (user.emailVerified) {
      const token = signToken(user);
      return res.json({ token, user: publicUser(user), message: 'Email already verified.' });
    }
    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({ message: 'No OTP pending. Please sign up or request a new code.' });
    }
    if (user.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    }
    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Check the code and try again.' });
    }

    user.emailVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const token = signToken(user);
    res.json({
      token,
      user: publicUser(user),
      message: 'Email verified successfully.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not verify OTP.' });
  }
});

// POST /auth/resend-otp — { email }
router.post('/resend-otp', async (req, res) => {
  try {
    let { email } = req.body;
    email = (email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found for this email.' });
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified. You can log in.' });
    }
    const otp = setUserOtp(user);
    await user.save();
    deliverOtpEmail(email, otp, user.name);
    res.json({
      message: 'A new OTP has been sent.',
      email,
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not resend OTP.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    email = (email || '').trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    if (typeof user.password !== 'string' || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const match = await bcrypt.compare(password || '', user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

    // Seed/demo accounts may predate emailVerified — treat missing as verified for old users with no otp pending
    if (user.emailVerified === false && user.otpCode) {
      return res.status(403).json({
        message: 'Please verify your email with the OTP before logging in.',
        requiresVerification: true,
        email: user.email
      });
    }
    // Auto-verify legacy accounts that never had OTP flow
    if (user.emailVerified === false && !user.otpCode) {
      user.emailVerified = true;
      await user.save();
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while logging in.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: publicUser(user) });
});

router.put('/profile', requireAuth, async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  if (name && name.trim()) user.name = name.trim();
  if (phone !== undefined) user.phone = typeof phone === 'string' ? phone.trim() : '';
  await user.save();
  res.json({ user: publicUser(user) });
});

module.exports = router;
