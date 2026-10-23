import crypto from 'crypto';
import User from '../models/people/User.js';
import sendEmail from '../utils/sendEmail.js';

export const inviteUser = async (req, res) => {
  const { email, role, managerId, teamId } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const inviteToken = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    email,
    role,
    managerId,
    teamId,
    status: 'invited',
    inviteToken,
    inviteExpires: Date.now() + 1000 * 60 * 60 * 72, 
  });

  const inviteLink = `${process.env.CLIENT_URL}/accept-invite/${inviteToken}`;
  await sendEmail({
    to: email,
    subject: 'You have been invited',
    html: `<p>Set up your account: <a href="${inviteLink}">${inviteLink}</a></p>`,
  });

  res.status(201).json({ message: 'Invite sent', userId: user._id });
};

export const acceptInvite = async (req, res) => {
  const { token, password } = req.body;

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const user = await User.findOne({
    inviteToken: token,
    inviteExpires: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ message: 'Invalid or expired invite' });


  user.password = password;
  user.status = 'active';
  user.inviteToken = undefined;
  user.inviteExpires = undefined;
  await user.save();

  res.json({ message: 'Account activated, you can now log in' });
};
