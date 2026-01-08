
import React, { useRef, useState } from 'react';
import { CameraIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, PhotoIcon } from './Icons';
import Modal from './Modal';

interface ImageUploadProps {
  billPhotos?: string[];
  onPhotosChange: (photos: string[]) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1024; // Max width/height
const JPEG_QUALITY = 0.7; // Compression quality

const ImageUpload: React.FC<ImageUploadProps> = ({ billPhotos = [], onPhotosChange }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isSourceSelectionOpen, setIsSourceSelectionOpen] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert(`File is too large. Please select an image under ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
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
    
    // Clear inputs so same file can be selected again
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    
    // Close source selection if open
    setIsSourceSelectionOpen(false);
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
    setIsSourceSelectionOpen(false);
  };

  const openGallery = () => {
    galleryInputRef.current?.click();
    setIsSourceSelectionOpen(false);
  }
  
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
    // If there are no photos, immediately show source options. 
    // Otherwise, open the manager where user can add more.
    if (billPhotos.length === 0) {
      setIsSourceSelectionOpen(true);
    } else {
      setIsManagerOpen(true);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {/* Compact Icon Button */}
      <button
        type="button"
        onClick={handlePrimaryClick}
        className={`relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border ${
          billPhotos.length > 0
            ? 'bg-primary dark:bg-primary-dark text-white dark:text-primary-on-dark border-transparent shadow-md'
            : 'bg-surface-container-highest/50 dark:bg-surface-dark-container-highest/50 text-surface-on-variant dark:text-surface-on-variant-dark border-transparent hover:bg-surface-container-highest dark:hover:bg-surface-dark-container-highest'
        }`}
        aria-label="Add or view bill photos"
      >
        <CameraIcon className="w-5 h-5" />
        {billPhotos.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error dark:bg-error-dark text-[9px] font-bold text-white dark:text-error-on-dark shadow-sm ring-2 ring-surface dark:ring-surface-dark">
                {billPhotos.length}
            </span>
        )}
      </button>

      {/* Source Selection Modal (Tiny Bottom Sheet style) */}
      {isSourceSelectionOpen && (
        <Modal onClose={() => setIsSourceSelectionOpen(false)} size="alert">
            <div className="p-4 bg-surface-container dark:bg-surface-dark-container rounded-xl">
                <h3 className="text-lg font-medium text-surface-on dark:text-surface-on-dark mb-4 text-center">Add Bill Photo</h3>
                <div className="flex gap-3">
                    <button onClick={openCamera} className="flex-1 flex flex-col items-center justify-center p-4 bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl hover:bg-primary/10 active:bg-primary/20 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-dark flex items-center justify-center mb-2">
                            <CameraIcon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-surface-on dark:text-surface-on-dark">Camera</span>
                    </button>
                    <button onClick={openGallery} className="flex-1 flex flex-col items-center justify-center p-4 bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl hover:bg-secondary/10 active:bg-secondary/20 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 dark:bg-secondary-dark/20 text-secondary dark:text-secondary-dark flex items-center justify-center mb-2">
                            <PhotoIcon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-surface-on dark:text-surface-on-dark">Gallery</span>
                    </button>
                </div>
                <button onClick={() => setIsSourceSelectionOpen(false)} className="w-full mt-4 py-2.5 text-sm font-medium text-surface-on-variant dark:text-surface-on-variant-dark hover:bg-surface-container-highest dark:hover:bg-surface-dark-container-highest rounded-full transition-colors">
                    Cancel
                </button>
            </div>
        </Modal>
      )}

      {/* Photo Manager Modal */}
      {isManagerOpen && (
        <Modal onClose={() => setIsManagerOpen(false)}>
          <div className="p-4 bg-surface-container dark:bg-surface-dark-container rounded-xl">
            <h3 className="text-xl font-bold mb-4 text-surface-on dark:text-surface-on-dark">Manage Bill Photos</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4 min-h-[8rem]">
              {billPhotos.map((photo, index) => (
                <div key={index} className="relative group aspect-square">
                  <img 
                      src={photo} 
                      onClick={() => setViewingIndex(index)}
                      alt={`Bill thumbnail ${index + 1}`} 
                      className="w-full h-full rounded-md object-cover cursor-pointer border border-surface-outline/20 dark:border-surface-outline-dark/20"
                  />
                  <button 
                      onClick={() => handleRemovePhoto(index)} 
                      className="absolute -top-1.5 -right-1.5 bg-error text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      aria-label={`Remove image ${index + 1}`}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setIsSourceSelectionOpen(true)}
                className="w-full h-full aspect-square rounded-md border-2 border-dashed border-surface-outline/30 dark:border-surface-outline-dark/30 text-surface-outline dark:text-surface-outline-dark hover:border-primary dark:hover:border-primary-dark hover:text-primary dark:hover:text-primary-dark transition-colors flex flex-col items-center justify-center"
                aria-label="Add a bill photo"
              >
                <PlusIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Add Photo</span>
              </button>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setIsManagerOpen(false)} className="px-5 py-2.5 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-full text-sm font-semibold hover:bg-primary/90 dark:hover:bg-primary-dark/90 shadow-sm transition-colors">Done</button>
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
