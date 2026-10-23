
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/people/User.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || user.status !== 'active') {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ user: { _id: user._id, email: user.email, role: user.role } });
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

export const getMe = (req, res) => {
  res.json({ user: req.user });
};
