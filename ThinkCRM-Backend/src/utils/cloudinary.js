import { v2 as cloudinary } from 'cloudinary';
import { AppError } from './AppError.js';
import streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Uploads a file (Buffer or base64 Data URI) to Cloudinary with smart compression
 * preserving visual fidelity while reducing file size.
 *
 * @param {Buffer|string} fileSource Buffer or base64 data URI string
 * @param {string} folder Target folder in Cloudinary
 * @param {object} customOptions Additional Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadToCloudinary = (fileSource, folder = 'thinkcrm/documents', customOptions = {}) => {
  const options = {
    folder: folder || 'thinkcrm/documents',
    resource_type: 'auto',
    quality: 'auto:good', // Intelligent perceptual compression without losing visual quality
    ...customOptions,
  };

  // If string (data URI or remote URL)
  if (typeof fileSource === 'string') {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(fileSource, options, (error, result) => {
        if (error) {
          console.error('Cloudinary string upload failed:', error);
          return reject(new AppError(`File upload failed: ${error.message || 'Cloudinary error'}`, 500));
        }
        resolve(result);
      });
    });
  }

  // If Buffer
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error('Cloudinary stream upload failed:', error);
          return reject(new AppError(`File upload failed: ${error.message || 'Cloudinary error'}`, 500));
        }
        resolve(result);
      }
    );
    streamifier.createReadStream(fileSource).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) return;
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    if (res?.result === 'not found' && resourceType === 'image') {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }
  } catch (error) {
    console.error('Failed to delete file from Cloudinary:', error);
  }
};

/**
 * Generates an authenticated download/view URL directly from Cloudinary API.
 * This works even if public CDN delivery for PDF/ZIP is not yet enabled in the dashboard.
 */
export const getCloudinaryDownloadUrl = (publicId, format = 'pdf', resourceType = 'image') => {
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: 'upload',
  });
};

