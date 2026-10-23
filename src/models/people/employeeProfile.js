import mongoose from 'mongoose';
import personalInfoSchema from '../nestedSchema/personalInfo.js';

export const EmploymentType = ['permanent', 'temporary'];
export const ChangeStatus = ['pending', 'approved', 'rejected'];

const employeeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    personalInfo: {
      type: personalInfoSchema,
      default: () => ({}),
    },
    // A small image, stored as a data URL (e.g. "data:image/png;base64,...").
    // Simple to store this way: no file server or extra package needed.
    profilePhoto: { type: String, default: null },
    dateOfBirth: { type: Date, required: true },
    hireDate: { type: Date, required: true },
    jobTitle: { type: String, required: true, trim: true },
    employmentType: {
      type: String,
      enum: EmploymentType,
      default: 'permanent',
      required: true,
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
    sensitive: {
      bankName: { type: String, select: false },
      accountNumber: { type: String, select: false },
      nin: { type: String, select: false },
    },
    pendingChanges: {
      data: { type: mongoose.Schema.Types.Mixed },   // the proposed edits
      status: { type: String, enum: ChangeStatus },  // no default: undefined means nothing pending
      requestedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  },
  { timestamps: true }
);

const EmployeeProfile = mongoose.model('EmployeeProfile', employeeProfileSchema);

export default EmployeeProfile;