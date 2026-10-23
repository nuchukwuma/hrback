const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export const validateProfilePhoto = (photo) => {
  if (!PHOTO_PATTERN.test(photo || '')) {
    return 'Please choose a JPEG, PNG or WebP image';
  }
  if (photo.length * 0.75 > MAX_PHOTO_BYTES) {
    return 'Image is too large (max 2MB)';
  }
  return null;
};