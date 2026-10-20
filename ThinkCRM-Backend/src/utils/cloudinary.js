import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from './AppError.js';
import streamifier from 'streamifier';

export const ensureCloudinaryConfigured = () => {
  const currentConfig = cloudinary.config();
  if (!currentConfig.api_key || !currentConfig.cloud_name || !currentConfig.api_secret) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  return cloudinary;
};

// Initial config attempt
ensureCloudinaryConfigured();

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
  ensureCloudinaryConfigured();
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
    ensureCloudinaryConfigured();
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
  ensureCloudinaryConfigured();
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: 'upload',
  });
};

/**
 * Transforms document object so url and fileUrl use Cloudinary's
 * authenticated private download URL, completely avoiding CDN 401 ACL failure.
 */
export const formatDocumentFileUrl = (doc) => {
  if (!doc) return doc;
  const dObj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };

  let storageKey = dObj.publicId || dObj.storageKey;
  if (!storageKey && dObj.url && dObj.url.includes('res.cloudinary.com')) {
    const match = dObj.url.match(/(?:image|raw)\/upload\/(?:v\d+\/)?([^.]+)/);
    if (match) storageKey = match[1];
  }

  if (storageKey) {
    let format = 'pdf';
    const nameLower = (dObj.name || '').toLowerCase();
    const urlLower = (dObj.url || '').toLowerCase();
    const fileTypeLower = (dObj.fileType || dObj.type || '').toLowerCase();

    if (fileTypeLower.includes('pdf') || nameLower.endsWith('.pdf') || urlLower.endsWith('.pdf')) {
      format = 'pdf';
    } else if (fileTypeLower.includes('png') || nameLower.endsWith('.png') || urlLower.endsWith('.png')) {
      format = 'png';
    } else if (fileTypeLower.includes('jpg') || fileTypeLower.includes('jpeg') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
      format = 'jpg';
    } else if (nameLower.includes('.')) {
      format = nameLower.split('.').pop();
    } else if (urlLower.includes('.')) {
      format = urlLower.split('?')[0].split('.').pop();
    }

    try {
      const authenticatedUrl = getCloudinaryDownloadUrl(storageKey, format, 'image');
      dObj.url = authenticatedUrl;
      dObj.fileUrl = authenticatedUrl;
      dObj.rawUrl = doc.url || dObj.url;
    } catch (e) {
      console.warn('Failed to sign Cloudinary download URL for document:', e.message);
    }
  }

  return dObj;
};

