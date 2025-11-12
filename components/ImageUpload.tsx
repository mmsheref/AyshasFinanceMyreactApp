import React, { useRef, useState } from 'react';
import { CameraIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from './Icons';
import Modal from './Modal';

interface ImageUploadProps {
  billPhotos?: string[];
  onPhotosChange: (photos: string[]) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1024; // Max width/height
const JPEG_QUALITY = 0.7; // Compression quality

const ImageUpload: React.FC<ImageUploadProps> = ({ billPhotos = [], onPhotosChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert(`File is too large. Please select an image under ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          onPhotosChange([...billPhotos, compressedBase64]);
        }
      };
      if (e.target?.result) img.src = e.target.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemovePhoto = (indexToRemove: number) => {
    onPhotosChange(billPhotos.filter((_, index) => index !== indexToRemove));
  }

  const navigateInViewer = (direction: 'next' | 'prev') => {
    if (viewingIndex === null) return;
    const nextIndex = direction === 'next' 
      ? (viewingIndex + 1) % billPhotos.length 
      : (viewingIndex - 1 + billPhotos.length) % billPhotos.length;
    setViewingIndex(nextIndex);
  }

  const handlePrimaryClick = () => {
    // If there are no photos, open file picker directly. Otherwise, open the manager.
    if (billPhotos.length === 0) {
      handleAddClick();
    } else {
      setIsManagerOpen(true);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {/* Compact button in the form */}
      <button
        type="button"
        onClick={handlePrimaryClick}
        className={`w-full mt-2 text-sm font-medium p-2 rounded-lg flex items-center justify-center transition-colors ${
          billPhotos.length > 0
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
        }`}
      >
        <CameraIcon className="w-4 h-4 mr-2" />
        {billPhotos.length > 0 ? `${billPhotos.length} photo(s) attached` : 'Add Bill Photo'}
      </button>

      {/* Photo Manager Modal */}
      {isManagerOpen && (
        <Modal onClose={() => setIsManagerOpen(false)}>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl">
            <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Manage Bill Photos</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4 min-h-[8rem]">
              {billPhotos.map((photo, index) => (
                <div key={index} className="relative group aspect-square">
                  <img 
                      src={photo} 
                      onClick={() => setViewingIndex(index)}
                      alt={`Bill thumbnail ${index + 1}`} 
                      className="w-full h-full rounded-md object-cover cursor-pointer border border-slate-200 dark:border-slate-700"
                  />
                  <button 
                      onClick={() => handleRemovePhoto(index)} 
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove image ${index + 1}`}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddClick}
                className="w-full h-full aspect-square rounded-md border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center"
                aria-label="Add a bill photo"
              >
                <PlusIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Add Photo</span>
              </button>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setIsManagerOpen(false)} className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 shadow-sm transition-colors">Done</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Photo Viewer Modal */}
      {viewingIndex !== null && (
        <Modal onClose={() => setViewingIndex(null)}>
          <div className="relative">
            <img src={billPhotos[viewingIndex]} alt={`Bill ${viewingIndex + 1} of ${billPhotos.length}`} className="max-w-full max-h-[80vh] rounded-lg" />
            {billPhotos.length > 1 && (
                <>
                    <button onClick={() => navigateInViewer('prev')} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white" aria-label="Previous image">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => navigateInViewer('next')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white" aria-label="Next image">
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs rounded-full px-2 py-1">
                        {viewingIndex + 1} / {billPhotos.length}
                    </div>
                </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default ImageUpload;
