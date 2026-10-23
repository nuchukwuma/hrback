// seedChat.js: sets up demo data for chat, posts and goals.
// Run it ONCE after "node src/seed.js":   node src/seedChat.js
// It is safe to run twice: it checks before creating anything.
import dns from 'node:dns';
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/people/User.js';
import Team from './models/people/Team.js';
import Channel from './models/chat/Channel.js';
import Message from './models/chat/Message.js';
import BulletinPost from './models/hr-models/BulletinPost.js';
import Goal from './models/hr-models/Goal.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

await mongoose.connect(process.env.MONGO_URI);

const hr = await User.findOne({ email: 'hr@example.com' });
const manager = await User.findOne({ email: 'manager@example.com' });
const ada = await User.findOne({ email: 'ada@example.com' });
const tunde = await User.findOne({ email: 'tunde@example.com' });

if (!hr || !manager || !ada || !tunde) {
  console.log('Demo users not found. Run "node src/seed.js" first.');
  await mongoose.disconnect();
  process.exit(1);
}

// 1. A team called Sales, with the manager, Ada and Tunde in it
let team = await Team.findOne({ name: 'Sales' });
if (!team) team = await Team.create({ name: 'Sales', dept: 'Sales', managerId: manager._id });
await User.updateMany({ _id: { $in: [manager._id, ada._id, tunde._id] } }, { $set: { teamId: team._id } });

// 2. The company channel and the Sales team channel
let company = await Channel.findOne({ type: 'company' });
if (!company) company = await Channel.create({ name: 'Company', type: 'company', createdBy: hr._id });

if (!(await Channel.exists({ type: 'team', team: team._id }))) {
  await Channel.create({ name: 'Sales team', type: 'team', team: team._id, createdBy: manager._id });
}

// 3. A first message, so the channel is not empty
if (!(await Message.exists({ channelId: company._id }))) {
  await Message.create({ channelId: company._id, senderId: hr._id, text: 'Welcome to the company channel!' });
}

// 4. Two posts: one for the whole company, one for the Sales team
if (!(await BulletinPost.exists({ title: 'Welcome to the HR app' }))) {
  await BulletinPost.create({
    title: 'Welcome to the HR app', body: 'Check the Goals page for your goals.',
    author: hr._id, audience: 'company', isPinned: true,
  });
}
if (!(await BulletinPost.exists({ title: 'Sales meeting on Friday' }))) {
  await BulletinPost.create({
    title: 'Sales meeting on Friday', body: 'Team only. 10am in the main office.',
    author: manager._id, audience: 'team', teamId: team._id,
  });
}

// 5. Two goals, so you can see the progress bars
if (!(await Goal.exists({ title: 'Complete onboarding' }))) {
  await Goal.create({ title: 'Complete onboarding', owner: ada._id, createdBy: manager._id, target: 10, current: 4 });
}
if (!(await Goal.exists({ title: 'Close 5 sales' }))) {
  await Goal.create({ title: 'Close 5 sales', owner: tunde._id, createdBy: manager._id, target: 5, current: 2 });
}

console.log('Chat demo data is ready.');
await mongoose.disconnect();
