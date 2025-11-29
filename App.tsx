
import React, { useEffect, useContext, useState, useCallback } from 'react';
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

const ExitConfirmModal: React.FC<{ onConfirm: () => void, onCancel: () => void }> = ({ onConfirm, onCancel }) => (
    <Modal onClose={onCancel}>
        <div className="p-6 bg-surface-container dark:bg-surface-dark-container rounded-[28px] text-center">
             <h3 className="text-xl font-bold mb-2 text-surface-on dark:text-surface-on-dark">Exit App?</h3>
             <p className="text-surface-on-variant dark:text-surface-on-variant-dark mb-6 text-sm">
                 Are you sure you want to close Ayshas Finance Tracker?
             </p>
             <div className="flex justify-center gap-3">
                 <button onClick={onCancel} className="px-5 py-2.5 text-primary dark:text-primary-dark font-medium hover:bg-surface-variant/10 rounded-full transition-colors">
                     Cancel
                 </button>
                 <button onClick={onConfirm} className="px-6 py-2.5 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-full font-medium hover:opacity-90 transition-opacity">
                     Exit
                 </button>
             </div>
        </div>
    </Modal>
);

const App: React.FC = () => {
  const { isLoading, handleRestore, sortedRecords } = useContext(AppContext);
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
        // 1. If Exit Modal is Open -> Exit App
        if (showExitModal) {
            CapacitorApp.exitApp();
            return;
        }

        // 2. If Import Modal is Open -> Close it
        if (pendingImportData) {
            setPendingImportData(null);
            return;
        }

        // 3. Check Route Depth
        // If we are on a Root Route, ask to exit.
        if (ROOT_ROUTES.includes(location.pathname)) {
            setShowExitModal(true);
        } else {
            // Otherwise, go back one step in history
            navigate(-1);
        }
    };

    const listenerPromise = CapacitorApp.addListener('backButton', handleBackButton);

    return () => {
        listenerPromise.then(listener => listener.remove()).catch(console.error);
    };
  }, [location.pathname, showExitModal, pendingImportData, navigate]);

  // --- JSON File Import Listener ---
  useEffect(() => {
    const listenerPromise = CapacitorApp.addListener('appUrlOpen', async (event) => {
      const url = event.url;
      if (!url || !url.toLocaleLowerCase().endsWith('.json')) {
        console.log('App opened with a non-JSON URL, ignoring:', url);
        return;
      }
      
      console.log('Attempting to import from URL:', url);
      try {
        const fetchUrl = Capacitor.isNativePlatform() ? Capacitor.convertFileSrc(url) : url;
        const response = await fetch(fetchUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch file content, status: ${response.status}`);
        }
        const data = await response.json();

        if (isBackupData(data)) {
            console.log('Valid backup file detected, prompting user for import.');
            
            if (sortedRecords.length > 0 && data.records.length > 0) {
                const newestAppRecordDateStr = sortedRecords[0].date;
                const sortedBackupRecords = [...data.records].sort((a, b) => b.date.localeCompare(a.date));
                const newestBackupRecordDateStr = sortedBackupRecords[0].date;

                if (newestBackupRecordDateStr < newestAppRecordDateStr) {
                    setIsOldBackup(true);
                } else {
                    setIsOldBackup(false);
                }
            } else {
                setIsOldBackup(false);
            }

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
  }, [sortedRecords]);

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
