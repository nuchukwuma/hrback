import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['employee', 'manager', 'hr'];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // An invited user has no password until they accept the invite
      required: function () {
        return this.status !== 'invited';
      },
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'employee',
      required: true,
    },
    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['invited','active','deactivated'],
      default: null,
      required: true,
    },
    inviteToken: {
      type: String,
      select: false,
    },
    inviteExpires: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// managerId and teamId already have "index: true" above, so only inviteToken needs an index here
userSchema.index({ inviteToken: 1 });

// Hash the password whenever it is set or changed.
// (No `next` argument: Mongoose 9 no longer provides one, and this style works on older versions too.)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare a plain-text password with the stored hash.
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Strip the password from any JSON output, just in case.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

export default User;