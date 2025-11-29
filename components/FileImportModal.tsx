import React from 'react';
import { BackupData } from '../types';
import Modal from './Modal';
import { UploadIcon, WarningIcon } from './Icons';

interface FileImportModalProps {
  data: BackupData;
  isOldBackup: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const FileImportModal: React.FC<FileImportModalProps> = ({ data, isOldBackup, onConfirm, onCancel }) => {
  return (
    <Modal onClose={onCancel} size="alert">
        <div className="p-6 pb-2 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-4 text-secondary dark:text-secondary-dark">
                <UploadIcon className="w-6 h-6" />
            </div>

            <h3 className="text-2xl font-normal text-surface-on dark:text-surface-on-dark mb-4">Restore Backup?</h3>
            
            <div className="space-y-4 text-sm text-surface-on-variant dark:text-surface-on-variant-dark">
                <p>
                    This file contains <span className="font-semibold text-surface-on dark:text-surface-on-dark">{data.records.length}</span> records.
                    {(Object.keys(data.customStructure).length > 0) && " It includes custom settings."}
                </p>

                {isOldBackup && (
                    <div className="p-3 bg-tertiary-container dark:bg-tertiary-container-dark rounded-xl text-left">
                        <p className="text-tertiary-on-container dark:text-tertiary-on-container-dark text-xs font-medium">
                            Warning: This backup appears older than your current data. You may lose recent progress.
                        </p>
                    </div>
                )}
                
                <p>Current app data will be replaced.</p>
            </div>
        </div>

        {/* Actions - MD3 Standard */}
        <div className="p-6 pt-2 flex justify-end gap-2">
            <button 
                onClick={onCancel} 
                className="px-3 py-2 text-sm font-medium text-primary dark:text-primary-dark rounded-full hover:bg-primary/10 dark:hover:bg-primary-dark/10 transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={onConfirm} 
                className="px-3 py-2 text-sm font-medium text-primary dark:text-primary-dark rounded-full hover:bg-primary/10 dark:hover:bg-primary-dark/10 transition-colors"
            >
                Restore
            </button>
        </div>
    </Modal>
  );
};

export default FileImportModal;