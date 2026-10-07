import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";

const CategoryImageUploader = ({
  currentImage, // string URL or { url, publicId } or null
  onUpload,     // async (file, onProgress) => Promise<void>
  onDelete,     // async () => Promise<void>
  onFileSelect, // (file) => void (for new category form)
  selectedFile, // File object (for new category form before save)
  disabled = false,
  maxSize = 5 * 1024 * 1024, // 5MB
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Derive display image URL
  const imageUrl = typeof currentImage === "object" ? currentImage?.url : currentImage;

  // Handle local file preview
  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setLocalPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setLocalPreview(null);
    }
  }, [selectedFile]);

  const onDrop = useCallback(
    async (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        toast.error(`File rejected. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB. Only JPG, PNG, WEBP allowed.`);
        return;
      }

      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      // If an immediate upload callback is provided (e.g. edit mode)
      if (onUpload) {
        setUploading(true);
        setUploadProgress(0);
        try {
          await onUpload(file, (percent) => {
            setUploadProgress(percent);
          });
        } catch (err) {
          console.error("Failed to upload category image:", err);
          toast.error(err?.message || "Failed to upload category image");
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      } else if (onFileSelect) {
        // Form mode: store selected file locally
        onFileSelect(file);
      }
    },
    [onUpload, onFileSelect, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxSize,
    multiple: false,
    disabled: disabled || uploading || isDeleting,
  });

  const handleDeleteExisting = async (e) => {
    e.stopPropagation();
    if (!onDelete) return;

    if (!window.confirm("Are you sure you want to delete this category image? It will be removed from Cloudinary.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error("Failed to delete category image:", err);
      toast.error(err?.message || "Failed to delete category image");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveLocalFile = (e) => {
    e.stopPropagation();
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const activeDisplayUrl = localPreview || imageUrl;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Category Image <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(Optional)</span>
        </label>
        {activeDisplayUrl && (
          <span className="text-xs text-slate-400">
            {localPreview ? "Pending Upload" : "Uploaded to Cloudinary"}
          </span>
        )}
      </div>

      {activeDisplayUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <img
              src={activeDisplayUrl}
              alt="Category Preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
              {selectedFile ? selectedFile.name : "Category Image"}
            </p>
            <p className="text-[11px] text-slate-400">
              {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : "Stored on Cloudinary"}
            </p>

            {uploading ? (
              <div className="w-full max-w-xs mt-2">
                <div className="flex justify-between text-[11px] font-semibold text-primary-500 mb-1">
                  <span>Uploading...</span>
                  <span className="tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                {localPreview ? (
                  <Button
                    type="button"
                    text="Remove"
                    icon="heroicons-outline:x-mark"
                    className="btn-danger btn-sm !py-1 !px-2 text-xs"
                    onClick={handleRemoveLocalFile}
                  />
                ) : (
                  <Button
                    type="button"
                    text="Delete Image"
                    icon="heroicons-outline:trash"
                    className="btn-danger btn-sm !py-1 !px-2 text-xs"
                    onClick={handleDeleteExisting}
                    isLoading={isDeleting}
                  />
                )}

                {/* Allow changing image by clicking */}
                <div {...getRootProps()} className="inline-block">
                  <input {...getInputProps()} />
                  <Button
                    type="button"
                    text="Change"
                    icon="heroicons-outline:arrow-path"
                    className="btn-outline-dark btn-sm !py-1 !px-2 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 scale-[0.99]"
              : "border-slate-300 dark:border-slate-700 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          } ${disabled || uploading ? "opacity-60 pointer-events-none" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className={`p-2.5 rounded-full ${isDragActive ? "bg-primary-100 text-primary-600 dark:bg-primary-900/40" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
              <Icon icon="heroicons-outline:cloud-arrow-up" className="text-2xl" />
            </div>

            {uploading ? (
              <div className="w-full max-w-xs mx-auto py-1">
                <div className="flex justify-between items-center text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5 text-primary-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Uploading...
                  </span>
                  <span className="tabular-nums font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-200 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isDragActive ? "Drop the category image here..." : "Drag & drop image here, or select from laptop"}
                </p>
                <p className="text-[11px] text-slate-400">
                  Supports JPG, PNG, WEBP (Max {Math.round(maxSize / 1024 / 1024)}MB) • Optional
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryImageUploader;
