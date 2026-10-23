import mongoose from 'mongoose';

const businessPartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Partner name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    assignedTeams: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave'],
      default: 'Active',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

businessPartnerSchema.index({ name: 'text', email: 'text', department: 'text' });

const BusinessPartner = mongoose.model('BusinessPartner', businessPartnerSchema);
export default BusinessPartner;