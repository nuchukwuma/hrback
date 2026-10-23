import mongoose from 'mongoose';
import Goal from '../models/hr-models/Goal.js';
import User from '../models/people/User.js';
import { scopeFilter } from '../utils/scope.js';

const sameId = (a, b) => Boolean(a && b) && String(a) === String(b);

//list goals

export const getGoals = async (req, res) => {

  const scope = await scopeFilter(req.user, 'owner');

  const goals = await Goal.find(scope)
    .populate('owner', 'email')
    .sort({ createdAt: -1 });

  res.json({ goals });
};

//create a goal

export const createGoal = async (req, res) => {
  const user = req.user;
  const { title, description, dueDate, ownerId } = req.body;
  const target = req.body.target === undefined || req.body.target === '' ? 100 : Number(req.body.target);

  if (!title?.trim()) return res.status(400).json({ message: 'A goal needs a title' });
  if (!(target > 0)) return res.status(400).json({ message: 'The target must be more than 0' });
  if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
    return res.status(400).json({ message: 'Choose a valid due date' });
  }

  //An employee can only make goals for themselves.
  let owner = user._id;

  if (ownerId && !sameId(ownerId, user._id)) {
    if (user.role === 'employee') {
      return res.status(403).json({ message: 'You can only create goals for yourself' });
    }
    if (!mongoose.isValidObjectId(ownerId)) {
      return res.status(400).json({ message: 'Choose a valid person' });
    }
    const person = await User.findOne({ _id: ownerId, status: 'active' });
    if (!person) return res.status(404).json({ message: 'Person not found' });

    // A manager can set goals for their own team. HR can set goals for anyone.
    if (user.role === 'manager' && !sameId(person.managerId, user._id)) {
      return res.status(403).json({ message: 'You can only set goals for your own team' });
    }
    owner = person._id;
  }

  const goal = await Goal.create({
    title,
    description,
    dueDate: dueDate || null,
    target,
    owner,
    createdBy: user._id,
  });

  const full = await Goal.findById(goal._id).populate('owner', 'email');
  res.status(201).json({ goal: full });
};

//update progress

export const updateProgress = async (req, res) => {
  const { id } = req.params;
  const current = Number(req.body.current);

  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Goal not found' });
  if (req.body.current === '' || req.body.current === undefined || Number.isNaN(current) || current < 0) {
    return res.status(400).json({ message: 'Progress must be a number, 0 or more' });
  }


  const scope = await scopeFilter(req.user, 'owner');
  const goal = await Goal.findOne({ $and: [{ _id: id }, scope] });
  if (!goal) return res.status(404).json({ message: 'Goal not found' });

  goal.current = Math.min(current, goal.target);              // never above the target
  goal.status = goal.current >= goal.target ? 'completed' : 'active';
  await goal.save();

  const full = await Goal.findById(goal._id).populate('owner', 'email');
  res.json({ goal: full });
};

//delete

export const deleteGoal = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Goal not found' });

  const scope = await scopeFilter(req.user, 'owner');
  const goal = await Goal.findOne({ $and: [{ _id: id }, scope] });
  if (!goal) return res.status(404).json({ message: 'Goal not found' });

  if (req.user.role !== 'hr' && !sameId(goal.createdBy, req.user._id)) {
    return res.status(403).json({ message: 'Only the person who created this goal can delete it' });
  }

  await goal.deleteOne();
  res.json({ message: 'Goal deleted' });
};
