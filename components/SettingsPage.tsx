import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackupRestore from './BackupRestore';
import { useAppContext } from '../context/AppContext';
import ExpenseStructureManager from './ExpenseStructureManager';
import { DatabaseIcon, PaintBrushIcon, InformationCircleIcon, ChevronRightIcon, XMarkIcon, HeartIcon } from './Icons';
import Modal from './Modal';

interface SettingsItemProps {
    icon: React.ReactNode, 
    title: string, 
    description: string, 
    children?: React.ReactNode, 
    onClick?: () => void 
}

const SettingsGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="px-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h2>
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
      {children}
    </div>
  </div>
);

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, description, children, onClick }) => {
  const content = (
    <div className="flex items-start p-4 space-x-4">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary mt-0.5">{icon}</div>
      <div className="flex-grow">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
      {onClick && <div className="flex-shrink-0 self-center"><ChevronRightIcon className="w-5 h-5 text-slate-400" /></div>}
    </div>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors first:rounded-t-xl last:rounded-b-xl">{content}</button>
    );
  }
  return <div className="first:rounded-t-xl last:rounded-b-xl">{content}</div>;
};

const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme } = useAppContext();
    const options: { label: string, value: 'light' | 'dark' | 'system' }[] = [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'System', value: 'system' },
    ];
    return (
        <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all w-full ${
                        theme === option.value
                            ? 'bg-white dark:bg-slate-950 text-primary shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};


const SettingsPage: React.FC = () => {
  const { records, customStructure, handleRestore, handleUpdateStructure } = useAppContext();
  const navigate = useNavigate();
  const [isStructureModalOpen, setStructureModalOpen] = useState(false);

  const onRestore = async (data: any) => {
    const count = await handleRestore(data);
    alert(`Successfully restored ${count} records.`);
    navigate('/');
  };

  return (
    <div className="space-y-8">
      <SettingsGroup title="Data">
        <SettingsItem icon={<DatabaseIcon className="w-5 h-5" />} title="Backup & Restore" description="Save all records to a file, export to CSV, or restore from a backup.">
          <BackupRestore onRestore={onRestore} allRecords={records} customStructure={customStructure} />
        </SettingsItem>
      </SettingsGroup>
      
      <SettingsGroup title="Customization">
        <SettingsItem icon={<PaintBrushIcon className="w-5 h-5" />} title="Manage Expense Structure" description="Add, edit, or remove expense categories and items for new records." onClick={() => setStructureModalOpen(true)} />
         <SettingsItem icon={<PaintBrushIcon className="w-5 h-5" />} title="Appearance" description="Choose how the application looks.">
          <ThemeSwitcher />
        </SettingsItem>
      </SettingsGroup>

       <SettingsGroup title="About">
        <SettingsItem icon={<InformationCircleIcon className="w-5 h-5" />} title="App Version" description="You are running the latest version of the application.">
          <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono py-1 px-2 rounded-md">v1.2.0</span>
        </SettingsItem>
         <SettingsItem icon={<HeartIcon className="w-5 h-5" />} title="Crafted by Ameer" description="Designed & developed for Aysha's." />
      </SettingsGroup>

      {isStructureModalOpen && (
        <Modal onClose={() => setStructureModalOpen(false)} size="large">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-h-[90vh] flex flex-col">
             <div className="flex-shrink-0 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
               <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manage Expense Structure</h2>
               <button onClick={() => setStructureModalOpen(false)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Close">
                  <XMarkIcon className="w-6 h-6 text-slate-500" />
               </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 sm:p-6">
                <ExpenseStructureManager structure={customStructure} onUpdate={handleUpdateStructure} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SettingsPage;