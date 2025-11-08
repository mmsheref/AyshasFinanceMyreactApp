
import React, { useRef, useState } from 'react';
import { CameraIcon, EyeIcon, TrashIcon } from './Icons';
import Modal from './Modal';

interface ImageUploadProps {
  billPhoto?: string;
  onPhotoChange: (base64: string | undefined) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (original file)
const MAX_DIMENSION = 1024; // Max width/height for compressed image
const JPEG_QUALITY = 0.7; // Compression quality

const ImageUpload: React.FC<ImageUploadProps> = ({ billPhoto, onPhotoChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert(`File is too large. Please select an image under ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          onPhotoChange(compressedBase64);
        } else {
            // Fallback for safety, though it should almost never happen in modern browsers
            onPhotoChange(e.target?.result as string);
        }
      };
      img.onerror = () => {
        alert("Failed to load image. Please try another file.");
      };
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
    
    // Clear the file input to allow re-selection of the same file
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleIconClick = () => {
    if (billPhoto) {
      setIsModalOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };
  
  const handleRemovePhoto = () => {
      onPhotoChange(undefined);
      setIsModalOpen(false);
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <button
        type="button"
        onClick={handleIconClick}
        className={`p-2 rounded-full transition-colors ${billPhoto ? 'text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/80 dark:text-blue-400' : 'text-gray-500 bg-gray-100 hover:bg-gray-200 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300'}`}
        title={billPhoto ? 'View Bill' : 'Upload Bill'}
      >
        {billPhoto ? <EyeIcon className="w-5 h-5" /> : <CameraIcon className="w-5 h-5" />}
      </button>

      {isModalOpen && billPhoto && (
        <Modal onClose={() => setIsModalOpen(false)}>
            <div className="relative">
                <img src={billPhoto} alt="Bill" className="max-w-full max-h-[80vh] rounded-lg" />
                <button 
                    onClick={handleRemovePhoto} 
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-lg"
                    title="Remove Photo"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </Modal>
      )}
    </>
  );
};

export default ImageUpload;