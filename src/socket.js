import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import mongoose from 'mongoose';
import User from './models/people/User.js';
import Channel from './models/chat/Channel.js';
import Message from './models/chat/Message.js';
import { canAccessChannel, channelFilterFor } from './utils/chatAccess.js';
import { roomOf } from './utils/chatRooms.js';

export function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  // 1. The security guard. It runs once for every new connection.
  //    It does the same job as your "protect" middleware, but for sockets.
  io.use(async (socket, next) => {
    try {
      // The browser sends the login cookie automatically (we turn that on in React)
      const cookies = parse(socket.handshake.headers.cookie || '');
      const token = socket.handshake.auth.token || cookies.token;
      if (!token) return next(new Error('Not logged in'));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id).select('-password');
      if (!user || user.status !== 'active') return next(new Error('User not found'));

      socket.user = user; // from now on we know who this connection belongs to
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // 2. Runs after the guard says yes
  io.on('connection', async (socket) => {
    const user = socket.user;

    // Rooms the SERVER chooses, based on who the user really is
    socket.join(`user:${user._id}`);
    if (user.teamId) socket.join(`team:${user.teamId}`);
    if (user.role === 'hr') socket.join('hr');

    // Someone sends a message
    socket.on('message:send', async (data, ack) => {
      try {
        const { channelId, text } = data || {};
        const clean = typeof text === 'string' ? text.trim() : '';

        if (!clean) return ack?.({ ok: false, error: 'Message is empty' });
        if (clean.length > 2000) return ack?.({ ok: false, error: 'Message is too long (2000 characters max)' });
        if (!mongoose.isValidObjectId(channelId)) return ack?.({ ok: false, error: 'Channel not found' });

        // Load the user again, so a deactivated person or a changed team is noticed straight away
        const me = await User.findById(user._id);
        if (!me || me.status !== 'active') return ack?.({ ok: false, error: 'Not allowed' });

        const channel = await Channel.findById(channelId);
        if (!channel || !canAccessChannel(me, channel)) {
          return ack?.({ ok: false, error: 'Channel not found' });
        }

        // The sender comes from the verified user, never from what the browser sent
        const message = await Message.create({ channelId: channel._id, senderId: me._id, text: clean });
        await message.populate('senderId', 'email');

        // Everyone in the channel's room gets it, including the sender
        io.to(roomOf(channel._id)).emit('message:new', message);
        ack?.({ ok: true });
      } catch (err) {
        console.error('message:send failed:', err.message);
        ack?.({ ok: false, error: 'Could not send the message' });
      }
    });

    // Join the room of every channel this user may use.
    // (This is last on purpose: all the socket.on(...) listeners above must be ready
    // before we await anything, or an early message could be missed.)
    const channels = await Channel.find(channelFilterFor(user)).select('_id');
    channels.forEach((channel) => socket.join(roomOf(channel._id)));
  });

  return io;
}
