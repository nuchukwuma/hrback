import mongoose from 'mongoose';
import Team from '../models/people/Team.js';
import User from '../models/people/User.js';
import EmployeeProfile from '../models/people/employeeProfile.js';

const getAccessibleTeam = async (req, teamId) => {
  if (!mongoose.isValidObjectId(teamId)) return null;
  const filter = { _id: teamId };
  if (req.user.role === 'manager') filter.managerId = req.user._id;
  return Team.findOne(filter);
};

export const getTeams = async (req, res) => {
  const filter = req.user.role === 'hr' ? {} : { managerId: req.user._id };
  const teams = await Team.find(filter)
    .populate('managerId', 'email')
    .sort({ name: 1 });
  res.json({ teams });
};

export const createTeam = async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const dept = typeof req.body.dept === 'string' ? req.body.dept.trim() : '';
  if (!name || !dept) return res.status(400).json({ message: 'Team name and department are required' });

  let managerId = req.user._id;
  if (req.user.role === 'hr') {
    managerId = req.body.managerId || null;
    if (managerId && !mongoose.isValidObjectId(managerId)) {
      return res.status(400).json({ message: 'Choose a valid team manager' });
    }
    if (managerId && !(await User.exists({ _id: managerId, role: 'manager', status: 'active' }))) {
      return res.status(400).json({ message: 'Choose an active manager' });
    }
  }

  const team = await Team.create({ name, dept, managerId });
  await team.populate('managerId', 'email');
  res.status(201).json({ team });
};

export const getTeamCandidates = async (req, res) => {
  const team = await getAccessibleTeam(req, req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  const filter = {
    role: 'employee',
    status: { $in: ['active', 'invited'] },
    teamId: { $ne: team._id },
  };
  if (req.user.role === 'manager') {
    filter.$or = [{ managerId: req.user._id }, { managerId: null }];
  }

  const users = await User.find(filter).select('email');
  const profiles = await EmployeeProfile.find({ userId: { $in: users.map((user) => user._id) } })
    .select('userId personalInfo.firstName personalInfo.lastName');
  const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));
  res.json({
    candidates: users.map((user) => ({
      _id: user._id,
      email: user.email,
      name: [profileByUserId.get(String(user._id))?.personalInfo?.firstName,
        profileByUserId.get(String(user._id))?.personalInfo?.lastName].filter(Boolean).join(' '),
    })),
  });
};

export const getTeamMembers = async (req, res) => {
  const team = await getAccessibleTeam(req, req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  const users = await User.find({ teamId: team._id, role: 'employee' }).select('email status');
  const profiles = await EmployeeProfile.find({ userId: { $in: users.map((user) => user._id) } })
    .select('userId personalInfo.firstName personalInfo.lastName');
  const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));
  res.json({
    members: users.map((user) => ({
      _id: user._id,
      email: user.email,
      status: user.status,
      name: [profileByUserId.get(String(user._id))?.personalInfo?.firstName,
        profileByUserId.get(String(user._id))?.personalInfo?.lastName].filter(Boolean).join(' '),
    })),
  });
};

export const addTeamMember = async (req, res) => {
  const team = await getAccessibleTeam(req, req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!mongoose.isValidObjectId(req.body.userId)) {
    return res.status(400).json({ message: 'Choose a valid employee' });
  }

  const memberFilter = {
    _id: req.body.userId,
    role: 'employee',
    status: { $in: ['active', 'invited'] },
  };
  if (req.user.role === 'manager') {
    memberFilter.$or = [{ managerId: req.user._id }, { managerId: null }];
  }
  const member = await User.findOne(memberFilter);
  if (!member) return res.status(404).json({ message: 'Employee not found or not in your scope' });

  member.teamId = team._id;
  if (team.managerId) member.managerId = team.managerId;
  await member.save();
  res.json({ message: 'Employee added to team' });
};

export const removeTeamMember = async (req, res) => {
  const team = await getAccessibleTeam(req, req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  const member = await User.findOne({ _id: req.params.userId, teamId: team._id, role: 'employee' });
  if (!member) return res.status(404).json({ message: 'Team member not found' });
  member.teamId = null;
  await member.save();
  res.json({ message: 'Employee removed from team' });
};
