import React from 'react';
import { BackupData } from '../types';
import Modal from './Modal';
import { WarningIcon, InformationCircleIcon } from './Icons';

interface FileImportModalProps {
  data: BackupData;
  isOldBackup: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const FileImportModal: React.FC<FileImportModalProps> = ({ data, isOldBackup, onConfirm, onCancel }) => {
  return (
    <Modal onClose={onCancel}>
        <div className="p-6 bg-surface-container-high dark:bg-surface-dark-container-high rounded-[28px] text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-secondary-container dark:bg-secondary-container-dark mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-secondary-on-container dark:text-secondary-on-container-dark">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-surface-on dark:text-surface-on-dark">Restore Backup?</h3>
            <p className="text-surface-on-variant dark:text-surface-on-variant-dark mb-6 text-sm">
                This contains <span className="font-bold text-surface-on dark:text-surface-on-dark">{data.records.length}</span> records.
                {(Object.keys(data.customStructure).length > 0) && (
                    <span className="block mt-1">It will also restore your custom expense settings.</span>
                )}
            </p>
            
            {isOldBackup && (
                <div className="text-left text-tertiary-on-container dark:text-tertiary-on-container-dark font-medium bg-tertiary-container dark:bg-tertiary-container-dark p-3 rounded-xl text-sm mb-4 flex items-start">
                    <InformationCircleIcon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <span>This backup appears older than your current data. You might lose recent progress.</span>
                </div>
            )}
            
            <div className="text-left text-error-on-container dark:text-error-on-container-dark font-medium bg-error-container dark:bg-error-container-dark p-3 rounded-xl text-sm mb-6 flex items-start">
                <WarningIcon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                <span>Current app data will be overwritten. This cannot be undone.</span>
            </div>

            <div className="flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="px-5 py-2.5 text-primary dark:text-primary-dark font-medium hover:bg-surface-variant/10 rounded-full transition-colors">Cancel</button>
                <button type="button" onClick={onConfirm} className="px-6 py-2.5 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-full font-medium hover:opacity-90 transition-opacity">Restore</button>
            </div>
        </div>
    </Modal>
  );
};

export default FileImportModal;