import React, { ReactNode, useEffect, useState, useRef } from 'react';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  size?: 'default' | 'large';
}

const Modal: React.FC<ModalProps> = ({ children, onClose, size = 'default' }) => {
  const [isClosing, setIsClosing] = useState(false);
  const sizeClass = size === 'large' ? 'max-w-4xl' : 'max-w-lg';
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    if (backdropRef.current) {
      backdropRef.current.style.opacity = '0';
    }
    setTimeout(onClose, 200); // Corresponds to scaleOut animation duration
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus trapping logic
  useEffect(() => {
    if (isClosing) return;

    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

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
    };
    
    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isClosing]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex justify-center items-center p-4 animate-fadeIn"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', transition: 'opacity 200ms ease-in-out' }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full ${sizeClass} ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;