import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  size?: 'default' | 'large' | 'alert'; // Added 'alert' size for MD3 dialogs
}

const Modal: React.FC<ModalProps> = ({ children, onClose, size = 'default' }) => {
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // MD3 Dialog Width Specs
  let widthClass = '';
  switch (size) {
    case 'alert':
        widthClass = 'w-[312px] min-w-[312px] max-w-[312px]'; // Strict Android Spec
        break;
    case 'large':
        widthClass = 'w-full max-w-4xl';
        break;
    case 'default':
    default:
        widthClass = 'w-full max-w-sm';
        break;
  }

  const handleClose = () => {
    setIsClosing(true);
    if (backdropRef.current) {
      backdropRef.current.style.opacity = '0';
    }
    setTimeout(onClose, 200);
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

      if (e.shiftKey) { 
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else { 
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isClosing]);

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex justify-center items-center p-4 animate-fadeIn"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', transition: 'opacity 200ms ease-in-out' }} // Standard MD3 Scrim
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className={`bg-surface-container-high dark:bg-surface-dark-container-high rounded-modal shadow-elevation-2 ${widthClass} ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'} overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;