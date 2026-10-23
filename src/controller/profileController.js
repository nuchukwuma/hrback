// controller/profileController.js
import EmployeeProfile from '../models/people/employeeProfile.js';
import { scopeFilter } from '../utils/scope.js';

export const getMyProfile = async (req, res) => {
  const profile = await EmployeeProfile.findOne({ userId: req.user._id });
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json({ profile });
};

// HR can read anyone. A manager can only read people on their team.
// scopeFilter works that out for us, and $and means "this user AND someone you may see".
export const getProfile = async (req, res) => {
  const allowed = await scopeFilter(req.user, 'userId');

  const profile = await EmployeeProfile.findOne({
    $and: [{ userId: req.params.userId }, allowed],
  });

  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json({ profile });
};

// Employees can only change these three things directly
export const updateMyProfile = async (req, res) => {
  const { phoneNumber, address, emergencyContact } = req.body;

  const profile = await EmployeeProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      $set: {
        'personalInfo.phoneNumber': phoneNumber,
        'personalInfo.address': address,
        emergencyContact,
      },
    },
    { new: true, runValidators: true }
  );

  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json({ profile });
};

// Only accept a small image, and only the three types the frontend offers.
// Data URLs look like: "data:image/png;base64,iVBORw0KGgo..."
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB
const PHOTO_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

const savePhoto = async (req, res, filter) => {
  const { photo } = req.body;

  if (!PHOTO_PATTERN.test(photo || '')) {
    return res.status(400).json({ message: 'Please choose a JPEG, PNG or WebP image' });
  }
  // Roughly how many bytes the base64 text decodes to
  const approxBytes = photo.length * 0.75;
  if (approxBytes > MAX_PHOTO_BYTES) {
    return res.status(400).json({ message: 'Image is too large (max 2MB)' });
  }

  const profile = await EmployeeProfile.findOneAndUpdate(
    filter,
    { $set: { profilePhoto: photo } },
    { new: true, runValidators: true }
  );
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json({ profile });
};

// An employee uploads their own photo
export const uploadMyPhoto = (req, res) => savePhoto(req, res, { userId: req.user._id });

// HR uploads anyone's photo
export const uploadPhotoAsHR = (req, res) => savePhoto(req, res, { userId: req.params.userId });

export const updateProfileAsHR = async (req, res) => {
  const { personalInfo, dateOfBirth, hireDate, jobTitle, employmentType, emergencyContact, sensitive } = req.body;

  const profile = await EmployeeProfile.findOneAndUpdate(
    { userId: req.params.userId },
    { personalInfo, dateOfBirth, hireDate, jobTitle, employmentType, emergencyContact, sensitive },
    { new: true, runValidators: true }
  );

  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json({ profile });
};
