import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { toast } from 'react-toastify';

const ProductImageUploader = ({ 
  existingImages = [], // Array of URLs
  onImagesChange,
  onDeleteExisting,
  onUploadNew,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024 // 5MB
}) => {
  const [localFiles, setLocalFiles] = useState([]); // Files selected but not yet uploaded
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(localFiles);
    }
  }, [localFiles, onImagesChange]);

  const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
    if (fileRejections.length > 0) {
      toast.error(`File rejected. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    if (onUploadNew) {
      setUploading(true);
      setUploadProgress(0);
      for (const file of acceptedFiles) {
        try {
          await onUploadNew(file, (percent) => {
            setUploadProgress(percent);
          });
        } catch (err) {
          console.error("Failed to upload image", file.name, err);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      setUploading(false);
      setUploadProgress(0);
    } else {
      const newFiles = acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }));
      setLocalFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
    }
  }, [onUploadNew, maxFiles, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize,
    maxFiles
  });

  const removeLocalFile = (e, index) => {
    e.stopPropagation();
    const newFiles = [...localFiles];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    setLocalFiles(newFiles);
  };

  const [deletingId, setDeletingId] = useState(null);

  const removeExistingFile = async (e, id) => {
    e.stopPropagation();
    if (onDeleteExisting) {
      setDeletingId(id);
      try {
        await onDeleteExisting(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Clean up object URLs
  useEffect(() => {
    return () => localFiles.forEach(file => URL.revokeObjectURL(file.preview));
  }, [localFiles]);

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Icon icon="heroicons-outline:cloud-upload" className={`text-4xl ${isDragActive ? 'text-primary-500' : 'text-slate-400'}`} />
          {uploading ? (
            <div className="w-full max-w-xs mx-auto py-2">
              <div className="flex justify-between items-center text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-primary-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Uploading images...
                </span>
                <span className="tabular-nums font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                {isDragActive ? 'Drop images here...' : 'Drag & drop images here, or click to select'}
              </p>
              <p className="text-xs text-slate-400">
                Supports JPG, PNG, WEBP (Max {maxFiles} files, {maxSize / 1024 / 1024}MB each)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Previews */}
      {(existingImages.length > 0 || localFiles.length > 0) && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Existing Images */}
          {existingImages.map((img, idx) => {
            const isDeletingThis = deletingId === img.id;
            return (
              <div key={`ext-${idx}`} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 aspect-square">
                <img src={img.url} alt={`Product ${idx}`} className={`w-full h-full object-cover transition-opacity ${isDeletingThis ? 'opacity-30' : ''}`} />
                {isDeletingThis ? (
                  <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white gap-1.5 z-10">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="text-[11px] font-medium">Deleting...</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      icon="heroicons-outline:trash" 
                      className="btn-danger btn-sm rounded-full" 
                      onClick={(e) => removeExistingFile(e, img.id)}
                      tooltip="Delete Image"
                      disabled={Boolean(deletingId)}
                    />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-0.5 rounded">
                  Saved
                </div>
              </div>
            );
          })}

          {/* Local / Pending Images */}
          {localFiles.map((file, idx) => (
            <div key={`loc-${idx}`} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 aspect-square">
              <img src={file.preview} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button 
                  icon="heroicons-outline:x-mark" 
                  className="btn-danger btn-sm rounded-full" 
                  onClick={(e) => removeLocalFile(e, idx)}
                  tooltip="Remove"
                />
              </div>
              <div className="absolute top-2 left-2 bg-warning-500 text-white text-[10px] px-2 py-0.5 rounded shadow">
                Pending
              </div>
            </div>
          ))}
          
        </div>
      )}
    </div>
  );
};

export default ProductImageUploader;
