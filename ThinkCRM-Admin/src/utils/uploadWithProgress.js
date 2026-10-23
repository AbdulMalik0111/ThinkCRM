/**
 * Uploads a file or FormData with XMLHttpRequest to support live upload progress events.
 * 
 * @param {Object} options
 * @param {string} options.url - API endpoint URL (e.g. 'leads/123/quotations' or full URL)
 * @param {FormData} [options.formData] - Existing FormData instance to send
 * @param {File} [options.file] - Fallback File object if formData not provided
 * @param {string} [options.fieldName='file'] - The form data field name if file provided
 * @param {string} [options.method='POST'] - HTTP method ('POST', 'PUT', 'PATCH')
 * @param {string} [options.token] - Optional auth token, defaults to localStorage.getItem('adminToken') or 'token'
 * @param {function} [options.onProgress] - Callback with percentage number (0 - 100)
 * @returns {Promise<Object>} Resolves with JSON response data
 */
export const uploadFileWithProgress = ({
  url,
  formData,
  file,
  fieldName = 'file',
  method = 'POST',
  token,
  onProgress,
}) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let dataToSend = formData;

    if (!dataToSend) {
      dataToSend = new FormData();
      if (file) {
        dataToSend.append(fieldName, file);
      }
    }

    if (xhr.upload && onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && event.total > 0) {
          const rawPercent = Math.round((event.loaded / event.total) * 100);
          // Clamp to 99% during client transmission so user sees active progress until server ACK
          const displayPercent = rawPercent >= 100 ? 99 : Math.max(1, rawPercent);
          onProgress(displayPercent);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
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
      reject(new Error('Upload was cancelled'));
    });

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://thinkcrm.onrender.com/api/v1';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const fullUrl = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `${cleanBase}/${cleanUrl}`;

    xhr.open(method.toUpperCase(), fullUrl);

    const authToken = token || localStorage.getItem('adminToken') || localStorage.getItem('token');
    if (authToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    }

    xhr.send(dataToSend);
  });
};
