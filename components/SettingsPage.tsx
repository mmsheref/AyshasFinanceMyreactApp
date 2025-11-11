import React from 'react';
import BackupRestore from './BackupRestore';
import { DailyRecord, CustomExpenseStructure, BackupData } from '../types';

interface SettingsPageProps {
  allRecords: DailyRecord[];
  customStructure: CustomExpenseStructure;
  onRestore: (data: BackupData) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ allRecords, customStructure, onRestore }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">Data Management</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Backup your data to a file, export it as a CSV for spreadsheets, or restore from a previous backup. It's a good idea to create backups regularly.
        </p>
        <BackupRestore 
          onRestore={onRestore} 
          allRecords={allRecords} 
          customStructure={customStructure} 
        />
      </div>
      
      {/* Placeholder for future settings */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm opacity-50">
        <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">App Preferences</h2>
        <p className="text-slate-600 dark:text-slate-400">
          More settings and customizations will be available here in the future.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
