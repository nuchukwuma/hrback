import mongoose from 'mongoose';

const bulletinPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    audience: { type: String, enum: ['company', 'team'], default: 'company', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    isPinned: { type: Boolean, default: false },
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true, trim: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const BulletinPost = mongoose.model('BulletinPost', bulletinPostSchema);

export default BulletinPost;
