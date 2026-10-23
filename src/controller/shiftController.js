import Shift from '../models/hr-models/Shift.js';
import ShiftSwap from '../models/hr-models/ShiftSwap.js';
import User from '../models/people/User.js';
import { scopeFilter } from '../utils/scope.js'; 

const CLOCK_IN_EARLY_MS = 30 * 60 * 1000; 

const sameId = (a, b) => Boolean(a && b) && String(a) === String(b);

const canManageUser = (actor, target) =>
  actor.role === 'hr' ||
  (actor.role === 'manager' && sameId(target.managerId, actor._id));

const hasOverlap = async (userId, start, end, excludeShiftId) => {
  const query = {
    userId,
    status: 'scheduled',
    startTime: { $lt: end },
    endTime: { $gt: start },
  };
  if (excludeShiftId) query._id = { $ne: excludeShiftId };
  return Boolean(await Shift.exists(query));
};



export const getPeople = async (req, res) => {
  const filter = { status: 'active', _id: { $ne: req.user._id } };

  if (req.user.role === 'manager') {
    filter.managerId = req.user._id; 
  } else if (req.user.role === 'employee') {
    if (!req.user.managerId) return res.json({ people: [] });
    filter.managerId = req.user.managerId; 
  } 

  const people = await User.find(filter).select('email role').sort({ email: 1 });
  res.json({ people });
};

//shifts

export const getShifts = async (req, res) => {


  await Shift.updateMany(
    { status: 'scheduled', clockIn: { $exists: false }, endTime: { $lt: new Date() } },
    { status: 'missed' }
  );

  const filter = await scopeFilter(req.user, 'userId');

  const { from, to } = req.query;
  if (from && to) {
    const f = new Date(from);
    const t = new Date(to);
    if (isNaN(f) || isNaN(t)) {
      return res.status(400).json({ message: 'Invalid date range' });
    }
  
    filter.startTime = { $lt: t };
    filter.endTime = { $gt: f };
  }

  const shifts = await Shift.find(filter)
    .populate('userId', 'email')
    .sort({ startTime: 1 });

  res.json({ shifts });
};

export const createShift = async (req, res) => {
  const { userId, startTime, endTime } = req.body;
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (!userId || isNaN(start) || isNaN(end)) {
    return res.status(400).json({ message: 'Employee, start time and end time are required' });
  }
  if (end <= start) {
    return res.status(400).json({ message: 'End time must be after start time' });
  }

  const target = await User.findById(userId);
  if (!target || target.status !== 'active') {
    return res.status(404).json({ message: 'Employee not found' });
  }
  if (!canManageUser(req.user, target)) {
    return res.status(403).json({ message: 'You can only assign shifts to your own team' });
  }
  if (await hasOverlap(target._id, start, end)) {
    return res.status(409).json({ message: 'This person already has a shift at that time' });
  }

  const shift = await Shift.create({
    userId: target._id,
    teamId: target.teamId,
    startTime: start,
    endTime: end,
    assignedBy: req.user._id, 
  });

  res.status(201).json({ shift });
};

export const cancelShift = async (req, res) => {
  const shift = await Shift.findById(req.params.id);
  if (!shift) return res.status(404).json({ message: 'Shift not found' });

  const owner = await User.findById(shift.userId);
  if (!owner || !canManageUser(req.user, owner)) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  if (shift.status !== 'scheduled' || shift.clockIn) {
    return res.status(400).json({ message: 'Only upcoming, unstarted shifts can be cancelled' });
  }

  shift.status = 'cancelled';
  await shift.save();

  
  await ShiftSwap.updateMany(
    { shiftId: shift._id, status: 'pending' },
    { status: 'cancelled' }
  );

  res.json({ shift });
};

//clock in / out

export const clockIn = async (req, res) => {

  const shift = await Shift.findOne({ _id: req.params.id, userId: req.user._id });
  if (!shift) return res.status(404).json({ message: 'Shift not found' });

  if (shift.status !== 'scheduled') {
    return res.status(400).json({ message: `This shift is ${shift.status}` });
  }
  if (shift.clockIn) {
    return res.status(400).json({ message: 'You have already clocked in' });
  }

  const now = Date.now();
  if (now < shift.startTime.getTime() - CLOCK_IN_EARLY_MS) {
    return res.status(400).json({ message: 'Too early to clock in' });
  }
  if (now > shift.endTime.getTime()) {
    return res.status(400).json({ message: 'This shift has already ended' });
  }

  shift.clockIn = new Date(now); 
  await shift.save();
  res.json({ shift });
};

export const clockOut = async (req, res) => {
  const shift = await Shift.findOne({ _id: req.params.id, userId: req.user._id });
  if (!shift) return res.status(404).json({ message: 'Shift not found' });

  if (!shift.clockIn) {
    return res.status(400).json({ message: 'Clock in first' });
  }
  if (shift.clockOut) {
    return res.status(400).json({ message: 'You have already clocked out' });
  }

  shift.clockOut = new Date();
  shift.status = 'completed';
  await shift.save();
  res.json({ shift });
};

//swap requests

export const createSwap = async (req, res) => {
  const { shiftId, swapWith, reason } = req.body;

  
  const shift = await Shift.findOne({ _id: shiftId, userId: req.user._id });
  if (!shift) return res.status(404).json({ message: 'Shift not found' });

  if (shift.status !== 'scheduled' || shift.clockIn || shift.startTime <= new Date()) {
    return res.status(400).json({ message: 'Only upcoming shifts can be swapped' });
  }

  const colleague = await User.findOne({ _id: swapWith, status: 'active' });
  if (!colleague || sameId(colleague._id, req.user._id)) {
    return res.status(400).json({ message: 'Choose a colleague to swap with' });
  }


  if (!sameId(colleague.managerId, req.user.managerId)) {
    return res.status(403).json({ message: 'You can only swap with a colleague on your team' });
  }

  if (await ShiftSwap.exists({ shiftId, status: 'pending' })) {
    return res.status(409).json({ message: 'This shift already has a pending swap request' });
  }
  if (await hasOverlap(colleague._id, shift.startTime, shift.endTime)) {
    return res.status(409).json({ message: 'That colleague already has a shift at that time' });
  }

  const swap = await ShiftSwap.create({
    shiftId,
    requestedBy: req.user._id,
    swapWith: colleague._id,
    reason,
  });

  res.status(201).json({ swap });
};

export const getSwaps = async (req, res) => {
  let filter = {};

  if (req.user.role === 'employee') {
    filter = { $or: [{ requestedBy: req.user._id }, { swapWith: req.user._id }] };
  } else if (req.user.role === 'manager') {
    const team = await User.find({ managerId: req.user._id }).select('_id');
    const ids = team.map((u) => u._id);
    filter = { $or: [{ requestedBy: { $in: ids } }, { requestedBy: req.user._id }] };
  } // HR: no filter

  const swaps = await ShiftSwap.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('shiftId', 'startTime endTime status')
    .populate('requestedBy', 'email')
    .populate('swapWith', 'email');

  res.json({ swaps });
};

export const reviewSwap = async (req, res) => {
  const { decision, note } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'Decision must be approved or rejected' });
  }

  const swap = await ShiftSwap.findById(req.params.id);
  if (!swap) return res.status(404).json({ message: 'Swap request not found' });
  if (swap.status !== 'pending') {
    return res.status(400).json({ message: 'This request has already been handled' });
  }

  const requester = await User.findById(swap.requestedBy);
  if (!requester) return res.status(404).json({ message: 'Requester not found' });

  if (sameId(requester._id, req.user._id)) {
    return res.status(403).json({ message: 'You cannot review your own request' });
  }
  if (!canManageUser(req.user, requester)) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (decision === 'approved') {
    const shift = await Shift.findById(swap.shiftId);

    if (
      !shift ||
      shift.status !== 'scheduled' ||
      shift.clockIn ||
      !sameId(shift.userId, swap.requestedBy)
    ) {
      return res.status(400).json({ message: 'This shift can no longer be swapped' });
    }
    if (await hasOverlap(swap.swapWith, shift.startTime, shift.endTime, shift._id)) {
      return res.status(409).json({ message: 'The colleague now has a clashing shift' });
    }

    const newOwner = await User.findById(swap.swapWith);
    shift.userId = swap.swapWith;
    if (newOwner?.teamId) shift.teamId = newOwner.teamId;
    await shift.save();
  }

  swap.status = decision;
  swap.reviewedBy = req.user._id;
  swap.reviewedAt = new Date();
  swap.reviewNote = note;
  await swap.save();

  res.json({ swap });
};

export const cancelSwap = async (req, res) => {
  const swap = await ShiftSwap.findOne({
    _id: req.params.id,
    requestedBy: req.user._id,
    status: 'pending',
  });
  if (!swap) return res.status(404).json({ message: 'Pending request not found' });

  swap.status = 'cancelled';
  await swap.save();
  res.json({ swap });
};