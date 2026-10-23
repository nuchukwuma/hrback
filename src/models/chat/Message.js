import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true } // adds createdAt, which the unread count uses
);


messageSchema.index({ channelId: 1, _id: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
