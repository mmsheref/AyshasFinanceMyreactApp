import React, { ReactNode, useEffect, useState, useRef } from 'react';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  size?: 'default' | 'large';
}

const Modal: React.FC<ModalProps> = ({ children, onClose, size = 'default' }) => {
  const [isShowing, setIsShowing] = useState(false);
  const sizeClass = size === 'large' ? 'max-w-4xl' : 'max-w-lg';
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsShowing(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      if (e.key === 'Tab') {
        // Focus trapping
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift+Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable element in the modal
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsShowing(false);
    setTimeout(onClose, 300); 
  };
  
  return (
    <div 
        className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${isShowing ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
        role="dialog"
        aria-modal="true"
    >
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full ${sizeClass} transition-all duration-300 ease-in-out ${isShowing ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;