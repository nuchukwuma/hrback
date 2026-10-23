import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    clockIn: { type: Date },
    clockOut: { type: Date },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'missed', 'cancelled'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

shiftSchema.pre('validate', function () {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    this.invalidate('endTime', 'End time must be after start time');
  }
});

shiftSchema.index({ userId: 1, startTime: 1 });
shiftSchema.index({ startTime: 1, endTime: 1 });

shiftSchema.virtual('durationHours').get(function () {
  if (!this.startTime || !this.endTime) return null;
  const ms = this.endTime.getTime() - this.startTime.getTime();
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
});

shiftSchema.virtual('workedHours').get(function () {
  if (!this.clockIn || !this.clockOut) return null;
  const ms = this.clockOut.getTime() - this.clockIn.getTime();
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
});

const Shift = mongoose.model('Shift', shiftSchema);

export default Shift;