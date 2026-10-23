import mongoose from 'mongoose';


const channelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['company', 'team', 'group'],
      required: true,
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null }, // only for type 'team'
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],           // only used for type 'group'
    isPinned: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const Channel = mongoose.model('Channel', channelSchema);

export default Channel;
