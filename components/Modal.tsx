import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  size?: 'default' | 'large';
}

const Modal: React.FC<ModalProps> = ({ children, onClose, size = 'default' }) => {
  const [isClosing, setIsClosing] = useState(false);
  const sizeClass = size === 'large' ? 'max-w-4xl' : 'max-w-sm w-full';
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

  // Using createPortal ensures the modal is rendered at the end of the document body,
  // bypassing any parent CSS transforms (like animations in Layout) that would otherwise 
  // break 'fixed' positioning and cause the modal to scroll with the page.
  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex justify-center items-center p-4 animate-fadeIn"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', transition: 'opacity 200ms ease-in-out' }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className={`bg-surface-container-high dark:bg-surface-dark-container-high rounded-modal shadow-2xl ${sizeClass} ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'} overflow-hidden border border-surface-outline/10 dark:border-surface-outline-dark/10 max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;