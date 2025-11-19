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
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600 dark:text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
            </div>
            <h3 className="text-xl font-bold mt-4 mb-2 dark:text-slate-100">Import Backup File?</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
                You've opened a backup file. Do you want to import its <span className="font-bold">{data.records.length}</span> records?
            </p>
            {isOldBackup && (
                <div className="text-amber-600 font-semibold bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 p-3 rounded-md text-sm mb-4">
                    <div className="flex items-start">
                        <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Heads up! The newest record in this backup is older than your current data. Importing will overwrite your recent progress.</span>
                    </div>
                </div>
            )}
            <div className="text-red-600 font-semibold bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-md text-sm">
                <div className="flex items-start">
                    <WarningIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Warning: This will overwrite all your current data. This action cannot be undone.</span>
                </div>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
                <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="button" onClick={onConfirm} className="px-5 py-2.5 bg-error text-white rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm transition-colors">Confirm & Import</button>
            </div>
        </div>
    </Modal>
  );
};

export default FileImportModal;