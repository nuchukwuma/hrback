import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, 
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, default: null },
    target: { type: Number, default: 100, min: 1 },  
    current: { type: Number, default: 0, min: 0 },   
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
  },
  { timestamps: true }
);


goalSchema.virtual('percent').get(function () {
  return Math.min(100, Math.round((this.current / this.target) * 100));
});


goalSchema.set('toJSON', { virtuals: true });

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
