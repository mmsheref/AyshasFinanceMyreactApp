import React, { useState, useRef } from 'react';
import { DailyRecord, CustomExpenseStructure, BackupData } from '../types';
import Modal from './Modal';
import { DownloadIcon, UploadIcon, ShareIcon } from './Icons';
import { saveBackupFile, shareBackupData, saveCsvFile } from '../utils/capacitor-utils';
import { convertToCSV } from '../utils/csv-utils';
import { isBackupData, isDailyRecord } from '../utils/validation-utils';

interface BackupRestoreProps {
  allRecords: DailyRecord[];
  customStructure: CustomExpenseStructure;
  onRestore: (data: BackupData) => void;
}

const BackupRestore: React.FC<BackupRestoreProps> = ({ allRecords, customStructure, onRestore }) => {
  const [showModal, setShowModal] = useState(false);
  const [recordsToImport, setRecordsToImport] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    if (allRecords.length === 0) {
      alert("No records to export.");
      return;
    }
    const backupData: BackupData = {
        version: 2, // New version with default values
        records: allRecords,
        customStructure: customStructure,
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `ayshas-backup-${new Date().toISOString().split('T')[0]}.json`;
    await saveBackupFile(fileName, jsonString);
  };

  const handleCsvExport = async () => {
    if (allRecords.length === 0) {
      alert("No records to export.");
      return;
    }
    try {
        const csvData = convertToCSV(allRecords);
        const fileName = `ayshas-export-${new Date().toISOString().split('T')[0]}.csv`;
        await saveCsvFile(fileName, csvData);
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert('An error occurred during CSV export.');
    }
  };
  
  const handleShare = async () => {
    if (allRecords.length === 0) {
      alert("No data to share.");
      return;
    }
    const backupData: BackupData = {
        version: 2,
        records: allRecords,
        customStructure: customStructure,
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `ayshas-backup-${new Date().toISOString().split('T')[0]}.json`;
    await shareBackupData(fileName, jsonString, "Aysha's P&L Backup");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File content is not readable.");
        
        const data = JSON.parse(text);

        if (isBackupData(data)) {
            setRecordsToImport(data);
            setShowModal(true);
        } else if (Array.isArray(data) && data.every(isDailyRecord)) {
            // Handle legacy backup format (records only, no custom structure)
            alert("Legacy backup file detected. Your custom expense structure will not be restored.");
            const legacyData: BackupData = { version: 0, records: data, customStructure: {} };
            setRecordsToImport(legacyData);
            setShowModal(true);
        } else {
          throw new Error('Invalid file structure. Please upload a valid backup file.');
        }

      } catch (error) {
        alert(error instanceof Error ? error.message : 'An unknown error occurred during file processing.');
      } finally {
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const confirmRestore = () => {
    if (recordsToImport) {
      onRestore(recordsToImport);
    }
    setShowModal(false);
    setRecordsToImport(null);
  };
  
  const cancelRestore = () => {
    setShowModal(false);
    setRecordsToImport(null);
  }

  const buttonClass = "flex items-center justify-center px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700/70 rounded-md transition-colors";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button onClick={handleBackup} className={buttonClass}>
            <DownloadIcon className="w-4 h-4 mr-2"/>
            Export Backup (.json)
        </button>
         <button onClick={handleCsvExport} className={buttonClass}>
            <DownloadIcon className="w-4 h-4 mr-2"/>
            Export for Excel (.csv)
        </button>
        <button onClick={handleShare} className={buttonClass}>
            <ShareIcon className="w-4 h-4 mr-2"/>
            Share Backup
        </button>
        <button onClick={() => fileInputRef.current?.click()} className={buttonClass}>
            <UploadIcon className="w-4 h-4 mr-2"/>
            Import Backup (.json)
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/json"
          className="hidden"
        />
      </div>
      {showModal && recordsToImport && (
        <Modal onClose={cancelRestore}>
            <div className="p-4 text-center bg-white dark:bg-slate-900 rounded-lg">
                <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Confirm Import</h3>
                <p className="text-gray-600 dark:text-slate-300 mb-2">You are about to import <span className="font-bold">{recordsToImport.records.length}</span> records.</p>
                 {Object.keys(recordsToImport.customStructure).length > 0 && (
                  <p className="text-gray-600 dark:text-slate-300 mb-2">This will also restore your saved custom expense structure.</p>
                )}
                <p className="text-red-600 font-semibold bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-md mt-4">
                    Warning: This will overwrite all your current data. This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-center space-x-4">
                    <button onClick={cancelRestore} className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700">Cancel</button>
                    <button onClick={confirmRestore} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Confirm & Import</button>
                </div>
            </div>
        </Modal>
      )}
    </>
  );
};

export default BackupRestore;