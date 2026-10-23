import mongoose from 'mongoose';


const historySchema = new mongoose.Schema(
  {
    status: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
    date: { type: Date, default: Date.now },
  },
  { _id: false } 
);

const requestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['leave', 'equipment', 'document', 'complaint', 'incident', 'other'],
      required: true,
    },
    topic: { type: String, required: true }, 
    essay: { type: String, required: true }, 
    date: { type: Date, required: true },

    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    aboutManager: { type: Boolean, default: false }, 
    routeToHR: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['submitted', 'in-review', 'approved', 'rejected', 'resolved'],
      default: 'submitted', 
    },
    history: [historySchema],
  },
  { timestamps: true } 
);

const Request = mongoose.model('Request', requestSchema);

export default Request;
