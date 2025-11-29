import React, { useState, useRef } from 'react';
import { DailyRecord, CustomExpenseStructure, BackupData } from '../types';
import FileImportModal from './FileImportModal';
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
  const [recordsToImport, setRecordsToImport] = useState<BackupData | null>(null);
  const [isOldBackup, setIsOldBackup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    if (allRecords.length === 0) {
      alert("No records to export.");
      return;
    }
    const backupData: BackupData = {
        version: 2,
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
    await shareBackupData(fileName, jsonString, "Ayshas Finance Tracker Backup");
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

        const processData = (backupData: BackupData) => {
            if (allRecords.length > 0 && backupData.records.length > 0) {
                // Use string comparison for dates to avoid timezone issues.
                // The 'YYYY-MM-DD' format is lexicographically sortable.
                const sortedAppRecords = [...allRecords].sort((a, b) => b.date.localeCompare(a.date));
                const newestAppRecordDateStr = sortedAppRecords[0].date;

                const sortedBackupRecords = [...backupData.records].sort((a, b) => b.date.localeCompare(a.date));
                const newestBackupRecordDateStr = sortedBackupRecords[0].date;

                if (newestBackupRecordDateStr < newestAppRecordDateStr) {
                    setIsOldBackup(true);
                } else {
                    setIsOldBackup(false);
                }
            } else {
                setIsOldBackup(false);
            }
            setRecordsToImport(backupData);
        };

        if (isBackupData(data)) {
            processData(data);
        } else if (Array.isArray(data) && data.every(isDailyRecord)) {
            // Handle legacy backup format (records only, no custom structure)
            alert("Legacy backup file detected. Your custom expense structure will not be restored.");
            const legacyData: BackupData = { version: 0, records: data, customStructure: {} };
            processData(legacyData);
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
    setRecordsToImport(null);
    setIsOldBackup(false);
  };
  
  const cancelRestore = () => {
    setRecordsToImport(null);
    setIsOldBackup(false);
  }

  const buttonClass = "flex items-center justify-center px-3 py-2 text-xs font-medium text-primary dark:text-primary-dark border border-surface-outline/30 dark:border-surface-outline-dark/30 hover:bg-surface-variant/20 rounded-lg transition-colors";

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
      {recordsToImport && (
        <FileImportModal
          data={recordsToImport}
          isOldBackup={isOldBackup}
          onConfirm={confirmRestore}
          onCancel={cancelRestore}
        />
      )}
    </>
  );
};

export default BackupRestore;