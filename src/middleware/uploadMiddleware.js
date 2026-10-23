import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve('uploads/profile-photos');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; 

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const ownerId = req.params.userId || req.user?._id || 'unknown';
    cb(null, `${ownerId}-${Date.now()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG or WebP images are allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_BYTES },
});

export default upload;


export function deletePhotoFile(relativeUrl) {
  if (!relativeUrl) return;
  const filename = path.basename(relativeUrl);
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.unlink(filePath, () => {}); 
}
