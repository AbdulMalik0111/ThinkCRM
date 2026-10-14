import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { AppError } from '../utils/AppError.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const fileSource = req.file ? req.file.buffer : req.body.dataUri || req.body.url;
    if (!fileSource) {
      throw new AppError('Please provide a file or image to upload', 400);
    }

    const folder = req.body.folder || 'thinkcrm/uploads';
    const result = await uploadToCloudinary(fileSource, folder);

    res.status(200).json({
      success: true,
      message: 'File uploaded and compressed successfully via Cloudinary',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        resourceType: result.resource_type,
        originalName: req.file ? req.file.originalname : (req.body.name || 'file'),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
