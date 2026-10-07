/**
 * Uploads a file with XMLHttpRequest to support upload progress events.
 * 
 * @param {Object} options
 * @param {string} options.url - API endpoint URL (e.g. 'catalog/products/123/images' or full URL)
 * @param {File} options.file - The File object to upload
 * @param {string} [options.fieldName='image'] - The form data field name
 * @param {string} [options.token] - Optional auth token, defaults to localStorage.getItem('adminToken')
 * @param {function} [options.onProgress] - Callback with percentage number (0 - 100)
 * @returns {Promise<Object>} Resolves with JSON response data
 */
export const uploadFileWithProgress = ({
  url,
  file,
  fieldName = 'image',
  token,
  onProgress,
}) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append(fieldName, file);

    if (xhr.upload && onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (onProgress) onProgress(100);
          resolve(response);
        } catch (e) {
          if (onProgress) onProgress(100);
          resolve(xhr.responseText);
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(errorData);
        } catch (e) {
          reject(new Error(xhr.statusText || 'Upload failed'));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const fullUrl = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `${cleanBase}/${cleanUrl}`;

    xhr.open('POST', fullUrl);

    const authToken = token || localStorage.getItem('adminToken');
    if (authToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    }

    xhr.send(formData);
  });
};
