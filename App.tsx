
import React, { useEffect, useContext, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { AppContext } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import RecordList from './components/RecordList';
import RecordForm from './components/RecordForm';
import RecordDetail from './components/RecordDetail';
import SettingsPage from './components/SettingsPage';
import Onboarding from './components/Onboarding';
import Reports from './components/Reports';
import FileImportModal from './components/FileImportModal';
import Modal from './components/Modal';
import { BackupData } from './types';
import { isBackupData } from './utils/validation-utils';
import { isBackupOlderThanCurrent } from './utils/record-utils';

const ROOT_ROUTES = ['/', '/records', '/reports', '/settings'];

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-slate-500 dark:text-slate-400">Loading App...</p>
        </div>
    </div>
);

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="records" element={<RecordList />} />
                <Route path="records/new" element={<RecordForm />} />
                <Route path="records/:recordId" element={<RecordDetail />} />
                <Route path="records/:recordId/edit" element={<RecordForm />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="reports" element={<Reports />} />
            </Route>
        </Routes>
    );
};

// MD3 Standard Basic Dialog
const ExitConfirmModal: React.FC<{ onConfirm: () => void, onCancel: () => void }> = ({ onConfirm, onCancel }) => (
    <Modal onClose={onCancel} size="alert">
        <div className="p-6 pb-2 text-center">
             <div className="flex justify-center mb-4 text-secondary dark:text-secondary-dark">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
             </div>

             <h3 className="text-2xl font-normal text-surface-on dark:text-surface-on-dark mb-4">Exit App?</h3>
             <p className="text-sm text-surface-on-variant dark:text-surface-on-variant-dark leading-relaxed">
                 Are you sure you want to close Ayshas Finance Tracker?
             </p>
        </div>
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
                Exit
            </button>
        </div>
    </Modal>
);

const App: React.FC = () => {
  const { isLoading, handleRestore, records } = useContext(AppContext);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<BackupData | null>(null);
  const [isOldBackup, setIsOldBackup] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('hasOnboarded') === 'true';
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
    setIsReady(true);
  }, []);

  // --- Hardware Back Button Handling ---
  useEffect(() => {
    const handleBackButton = async () => {
        if (showExitModal) {
            CapacitorApp.exitApp();
            return;
        }

        if (pendingImportData) {
            setPendingImportData(null);
            return;
        }

        if (ROOT_ROUTES.includes(location.pathname)) {
            setShowExitModal(true);
        } else {
            navigate(-1);
        }
    };

    const listenerPromise = CapacitorApp.addListener('backButton', handleBackButton);

    return () => {
        listenerPromise.then(listener => listener.remove()).catch(console.error);
    };
  }, [location.pathname, showExitModal, pendingImportData, navigate]);

  // --- JSON File Import Listener (Native) ---
  useEffect(() => {
    const listenerPromise = CapacitorApp.addListener('appUrlOpen', async (event) => {
      const url = event.url;
      if (!url || !url.toLocaleLowerCase().endsWith('.json')) {
        return;
      }
      
      try {
        const fetchUrl = Capacitor.isNativePlatform() ? Capacitor.convertFileSrc(url) : url;
        const response = await fetch(fetchUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch file content, status: ${response.status}`);
        }
        const data = await response.json();

        if (isBackupData(data)) {
            setIsOldBackup(isBackupOlderThanCurrent(records, data));
            setPendingImportData(data);
        } else {
            alert('The selected file is not a valid backup file for this application.');
        }
      } catch (error) {
        console.error('Error handling opened file:', error);
        alert(`An error occurred while trying to read the backup file. Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    return () => {
        listenerPromise.then(listener => listener.remove())
            .catch(e => console.error('Failed to remove appUrlOpen listener', e));
    };
  }, [records]);

  const handleOnboardingFinish = () => {
    localStorage.setItem('hasOnboarded', 'true');
    setShowOnboarding(false);
  };
  
  const handleConfirmImport = async () => {
    if (pendingImportData) {
      await handleRestore(pendingImportData);
      setPendingImportData(null);
      setIsOldBackup(false);
    }
  };

  const handleCancelImport = () => {
    setPendingImportData(null);
    setIsOldBackup(false);
  };

  if (!isReady || isLoading) {
    return <LoadingSpinner />;
  }

  if (showOnboarding) {
    return <Onboarding onFinish={handleOnboardingFinish} />;
  }

  return (
    <>
      <AppRoutes />
      
      {pendingImportData && (
        <FileImportModal
          data={pendingImportData}
          isOldBackup={isOldBackup}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelImport}
        />
      )}

      {showExitModal && (
          <ExitConfirmModal 
            onConfirm={() => CapacitorApp.exitApp()}
            onCancel={() => setShowExitModal(false)}
          />
      )}
    </>
  );
};

export default App;
