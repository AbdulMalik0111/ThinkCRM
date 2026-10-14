import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
  ];

  if (
    file.mimetype.startsWith('image/') ||
    allowedMimes.includes(file.mimetype) ||
    file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|csv|txt|zip|png|jpe?g|webp|svg)$/i)
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Allowed: PDF, Images, Word, Excel, CSV, and ZIP files.', 400), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
});
