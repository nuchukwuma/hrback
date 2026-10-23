import crypto from 'node:crypto';
import mongoose from 'mongoose';
import EmployeeProfile, { EmploymentType } from '../models/people/employeeProfile.js';
import Team from '../models/people/Team.js';
import User, { ROLES } from '../models/people/User.js';
import sendEmail from '../utils/sendEmail.js';
import { scopeFilter } from '../utils/scope.js';
import { clientUrl } from '../utils/clientOrigins.js';
import { validateProfilePhoto } from '../utils/profilePhoto.js';

export const getEmployees = async (req, res) => {
  const filter = await scopeFilter(req.user, 'userId');
  const items = await EmployeeProfile.find(filter)
    .populate({
      path: 'userId',
      select: 'email role status managerId teamId',
      populate: { path: 'teamId', select: 'name' },
    })
    .sort({ hireDate: -1 });

  res.json({ items });
};

export const getManagers = async (_req, res) => {
  const managers = await User.find({ role: 'manager', status: 'active' })
    .select('email')
    .sort({ email: 1 });
  res.json({ managers });
};

export const createEmployee = async (req, res) => {
  const {
    email,
    role,
    managerId,
    teamId,
    firstName,
    lastName,
    dateOfBirth,
    hireDate,
    jobTitle,
    employmentType,
    profilePhoto,
  } = req.body;

  if (typeof email !== 'string' || !email.trim() || !firstName || !lastName || !dateOfBirth || !hireDate || !jobTitle) {
    return res.status(400).json({ message: 'Complete all required employee fields' });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: 'Choose a valid employee role' });
  }
  if (!EmploymentType.includes(employmentType)) {
    return res.status(400).json({ message: 'Choose a valid employment type' });
  }
  if (profilePhoto) {
    const photoError = validateProfilePhoto(profilePhoto);
    if (photoError) return res.status(400).json({ message: photoError });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: 'A user with this email already exists' });
  }

  let selectedManagerId = role === 'manager' ? null : managerId || null;
  if (selectedManagerId) {
    if (!mongoose.isValidObjectId(selectedManagerId)) {
      return res.status(400).json({ message: 'Choose a valid manager' });
    }
    const manager = await User.findOne({ _id: selectedManagerId, role: 'manager', status: 'active' });
    if (!manager) return res.status(400).json({ message: 'Choose an active manager' });
  } else {
    selectedManagerId = null;
  }

  const selectedTeamId = teamId || null;
  if (selectedTeamId) {
    if (!mongoose.isValidObjectId(selectedTeamId) || !(await Team.exists({ _id: selectedTeamId }))) {
      return res.status(400).json({ message: 'Choose a valid team' });
    }
  }

  const dob = new Date(dateOfBirth);
  const hired = new Date(hireDate);
  if (Number.isNaN(dob.getTime()) || Number.isNaN(hired.getTime())) {
    return res.status(400).json({ message: 'Enter valid birth and hire dates' });
  }

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const user = await User.create({
    email: normalizedEmail,
    role,
    managerId: selectedManagerId,
    teamId: selectedTeamId,
    hrId: req.user._id,
    status: 'invited',
    inviteToken,
    inviteExpires: new Date(Date.now() + 72 * 60 * 60 * 1000),
  });

  let profile;
  try {
    profile = await EmployeeProfile.create({
      userId: user._id,
      personalInfo: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
      },
      profilePhoto: profilePhoto || null,
      dateOfBirth: dob,
      hireDate: hired,
      jobTitle: jobTitle.trim(),
      employmentType,
    });
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  const inviteLink = `${clientUrl}/accept-invite/${inviteToken}`;
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'You have been invited',
      html: `<p>Set up your account: <a href="${inviteLink}">${inviteLink}</a></p>`,
    });
  } catch (error) {
    await EmployeeProfile.deleteOne({ _id: profile._id });
    await User.deleteOne({ _id: user._id });
    return res.status(503).json({ message: error.message });
  }

  res.status(201).json({ message: 'Employee invited', item: profile });
};
