import mongoose from 'mongoose';


const readStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  lastReadAt: { type: Date, default: Date.now },
});


readStateSchema.index({ userId: 1, channelId: 1 }, { unique: true });

const ReadState = mongoose.model('ReadState', readStateSchema);

export default ReadState;
