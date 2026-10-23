import mongoose from 'mongoose';
import Channel from '../models/chat/Channel.js';
import Message from '../models/chat/Message.js';
import ReadState from '../models/chat/ReadState.js';
import Team from '../models/people/Team.js';
import User from '../models/people/User.js';
import { canAccessChannel, channelFilterFor } from '../utils/chatAccess.js';
import { joinChannelRooms, roomOf } from '../utils/chatRooms.js';

const sameId = (a, b) => Boolean(a && b) && String(a) === String(b);


const cannotManageMembers = (user, channel) => !sameId(channel.createdBy, user._id);


const loadChannel = async (req, res) => {
  const { id } = req.params;
  const channel = mongoose.isValidObjectId(id) ? await Channel.findById(id) : null;

  if (!channel || !canAccessChannel(req.user, channel)) {
    res.status(404).json({ message: 'Channel not found' });
    return null;
  }
  return channel;
};


export const getChannels = async (req, res) => {
  const channels = await Channel.find(channelFilterFor(req.user))
    .populate('members', 'email')
    .sort({ type: 1, name: 1 });


    const readStates = await ReadState.find({
    userId: req.user._id,
    channelId: { $in: channels.map((c) => c._id) },
  });
  const lastRead = {};
  readStates.forEach((r) => {
    lastRead[r.channelId] = r.lastReadAt;
  });

  const result = await Promise.all(
    channels.map(async (channel) => {

      const filter = { channelId: channel._id, senderId: { $ne: req.user._id } };
      if (lastRead[channel._id]) filter.createdAt = { $gt: lastRead[channel._id] };

      const unread = await Message.countDocuments(filter);
      return { ...channel.toObject(), unread };
    })
  );

  res.json({ channels: result });
};

//create a channel

export const createChannel = async (req, res) => {
  const user = req.user;
  const { name, type, teamId, memberIds = [] } = req.body;

  if (user.role === 'employee') {
    return res.status(403).json({ message: 'Only managers and HR can create channels' });
  }
  if (!['company', 'team', 'group'].includes(type)) {
    return res.status(400).json({ message: 'Choose a channel type' });
  }

  const data = { type, createdBy: user._id };

  if (type === 'company') {
    if (user.role !== 'hr') {
      return res.status(403).json({ message: 'Only HR can create the company channel' });
    }
    if (await Channel.exists({ type: 'company' })) {
      return res.status(400).json({ message: 'The company channel already exists' });
    }
    data.name = name?.trim() || 'Company';
  }

  if (type === 'team') {
    // HR picks any team. A manager can only make a channel for their OWN team.
    const wantedTeamId = user.role === 'hr' ? teamId : user.teamId;
    if (!wantedTeamId || !mongoose.isValidObjectId(wantedTeamId)) {
      return res.status(400).json({ message: 'Choose a team' });
    }
    const team = await Team.findById(wantedTeamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (await Channel.exists({ type: 'team', team: team._id })) {
      return res.status(400).json({ message: 'This team already has a channel' });
    }
    data.team = team._id;
    data.name = name?.trim() || `${team.name} team`;
  }

  if (type === 'group') {
    if (!name?.trim()) return res.status(400).json({ message: 'Give the channel a name' });
    if (!Array.isArray(memberIds) || !memberIds.every((id) => mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: 'Invalid member list' });
    }

  
    const ids = [...new Set(memberIds.map(String))].filter((id) => id !== String(user._id));
    const people = await User.find({ _id: { $in: ids }, status: 'active' });
    if (people.length !== ids.length) {
      return res.status(400).json({ message: 'One of the people could not be found' });
    }
    // A manager may only add people from their own team
    if (user.role === 'manager' && people.some((p) => !sameId(p.managerId, user._id))) {
      return res.status(403).json({ message: 'You can only add people from your own team' });
    }

    data.name = name.trim();
    data.members = [user._id, ...ids];
  }

  const channel = await Channel.create(data);

 
  const io = req.app.get('io');
  joinChannelRooms(io, channel);
  io?.to(roomOf(channel._id)).emit('channel:new');

  res.status(201).json({ channel });
};

//members of a group channel

export const addMember = async (req, res) => {
  const channel = await loadChannel(req, res);
  if (!channel) return;

  if (channel.type !== 'group') {
    return res.status(400).json({ message: 'Only group channels have a member list' });
  }

  if (cannotManageMembers(req.user, channel)) {
    return res.status(403).json({ message: 'Only the channel creator can add people' });
  }

  const { userId } = req.body;
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: 'Choose a person to add' });
  }
  const person = await User.findOne({ _id: userId, status: 'active' });
  if (!person) return res.status(404).json({ message: 'Person not found' });

  if (req.user.role === 'manager' && !sameId(person.managerId, req.user._id)) {
    return res.status(403).json({ message: 'You can only add people from your own team' });
  }

  channel.members.addToSet(person._id);
  await channel.save();

  const io = req.app.get('io');
  io?.in(`user:${person._id}`).socketsJoin(roomOf(channel._id)); 
  io?.to(`user:${person._id}`).emit('channel:new');              

  res.json({ channel });
};

export const removeMember = async (req, res) => {
  const channel = await loadChannel(req, res);
  if (!channel) return;

  if (channel.type !== 'group') {
    return res.status(400).json({ message: 'Only group channels have a member list' });
  }

  const { userId } = req.params;
  const leavingMyself = sameId(userId, req.user._id);

  // remove yourself
  if (!leavingMyself && cannotManageMembers(req.user, channel)) {
    return res.status(403).json({ message: 'Only the channel creator can remove people' });
  }
  if (sameId(userId, channel.createdBy)) {
    return res.status(400).json({ message: 'The channel creator cannot be removed or leave' });
  }

  channel.members.pull(userId);
  await channel.save();
  await ReadState.deleteOne({ userId, channelId: channel._id });

  const io = req.app.get('io');
  io?.in(`user:${userId}`).socketsLeave(roomOf(channel._id)); 
  io?.to(`user:${userId}`).emit('channel:removed');

  res.json({ channel });
};

//messages
export const getMessages = async (req, res) => {
  const channel = await loadChannel(req, res);
  if (!channel) return;

  const { before } = req.query;
  if (before && !mongoose.isValidObjectId(before)) {
    return res.status(400).json({ message: 'Invalid "before" value' });
  }

  const limit = Math.min(Number(req.query.limit) || 30, 50);

  const filter = { channelId: channel._id };
  if (before) filter._id = { $lt: before }; 

  const found = await Message.find(filter)
    .sort({ _id: -1 }) 
    .limit(limit + 1)
    .populate('senderId', 'email');

  const hasMore = found.length > limit;
  const page = found.slice(0, limit).reverse(); 

  res.json({ messages: page, hasMore });
};



export const markRead = async (req, res) => {
  const channel = await loadChannel(req, res);
  if (!channel) return;

  await ReadState.findOneAndUpdate(
    { userId: req.user._id, channelId: channel._id },
    { $set: { lastReadAt: new Date() } },
    { upsert: true }
  );

  res.json({ ok: true });
};
