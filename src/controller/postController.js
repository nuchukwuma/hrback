import mongoose from 'mongoose';
import BulletinPost from '../models/hr-models/BulletinPost.js';
import Team from '../models/people/Team.js';

const sameId = (a, b) => Boolean(a && b) && String(a) === String(b);


const canSeePost = (user, post) =>
  user.role === 'hr' ||
  post.audience === 'company' ||
  sameId(user.teamId, post.teamId);

const loadPost = async (req, res) => {
  const { id } = req.params;
  const post = mongoose.isValidObjectId(id) ? await BulletinPost.findById(id) : null;

  if (!post || !canSeePost(req.user, post)) {
    res.status(404).json({ message: 'Post not found' });
    return null;
  }
  return post;
};

const withPeople = (query) =>
  query.populate('author', 'email').populate('comments.userId', 'email');


export const getPosts = async (req, res) => {
  let filter = {};

  if (req.user.role !== 'hr') {
    const options = [{ audience: 'company' }];
    if (req.user.teamId) options.push({ audience: 'team', teamId: req.user.teamId });
    filter = { $or: options };
  }


  const posts = await withPeople(BulletinPost.find(filter).sort({ isPinned: -1, createdAt: -1 }).limit(50));
  res.json({ posts });
};

//create a post

export const createPost = async (req, res) => {
  const user = req.user;
  const { title, body, audience = 'company', teamId } = req.body;

  if (user.role === 'employee') {
    return res.status(403).json({ message: 'Only managers and HR can create posts' });
  }
  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ message: 'A title and some text are required' });
  }
  if (!['company', 'team'].includes(audience)) {
    return res.status(400).json({ message: 'Choose who the post is for' });
  }

  const data = { title, body, audience, author: user._id };

  if (audience === 'company' && user.role !== 'hr') {
    return res.status(403).json({ message: 'Only HR can post to the whole company' });
  }

  if (audience === 'team') {
    // HR chooses the team. A manager can only post to their OWN team.
    const wantedTeamId = user.role === 'hr' ? teamId : user.teamId;
    if (!wantedTeamId || !mongoose.isValidObjectId(wantedTeamId)) {
      return res.status(400).json({ message: 'Choose a team' });
    }
    if (!(await Team.exists({ _id: wantedTeamId }))) {
      return res.status(404).json({ message: 'Team not found' });
    }
    data.teamId = wantedTeamId;
  }

  const post = await BulletinPost.create(data);
  const full = await withPeople(BulletinPost.findById(post._id));
  res.status(201).json({ post: full });
};

//comment

export const addComment = async (req, res) => {
  const post = await loadPost(req, res);
  if (!post) return;

  const text = req.body.text?.trim();
  if (!text) return res.status(400).json({ message: 'Write a comment first' });

  post.comments.push({ userId: req.user._id, text });
  await post.save();

  const full = await withPeople(BulletinPost.findById(post._id));
  res.status(201).json({ post: full });
};


export const togglePin = async (req, res) => {
  const post = await loadPost(req, res);
  if (!post) return;

  post.isPinned = !post.isPinned;
  await post.save();

  const full = await withPeople(BulletinPost.findById(post._id));
  res.json({ post: full });
};

//delete 

export const deletePost = async (req, res) => {
  const post = await loadPost(req, res);
  if (!post) return;

  if (req.user.role !== 'hr' && !sameId(post.author, req.user._id)) {
    return res.status(403).json({ message: 'You can only delete your own posts' });
  }

  await post.deleteOne();
  res.json({ message: 'Post deleted' });
};
