import React, { useEffect, useContext, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

import { AppContext } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import RecordList from './components/RecordList';
import RecordForm from './components/RecordForm';
import RecordDetail from './components/RecordDetail';
import SettingsPage from './components/SettingsPage';
import Onboarding from './components/Onboarding';

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
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const listenerPromise = CapacitorApp.addListener('backButton', () => {
            if (location.pathname === '/') {
                CapacitorApp.exitApp();
            } else {
                navigate(-1);
            }
        });

        return () => {
            listenerPromise.then(listener => {
                listener.remove();
            }).catch(error => {
                console.error('Failed to remove backButton listener', error);
            });
        };
    }, [location, navigate]);

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="records" element={<RecordList />} />
                <Route path="records/new" element={<RecordForm />} />
                <Route path="records/:recordId" element={<RecordDetail />} />
                <Route path="records/:recordId/edit" element={<RecordForm />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>
        </Routes>
    );
};

const App: React.FC = () => {
  const { isLoading } = useContext(AppContext);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('hasOnboarded') === 'true';
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
    setIsReady(true);
  }, []);

  const handleOnboardingFinish = () => {
    localStorage.setItem('hasOnboarded', 'true');
    setShowOnboarding(false);
  };
  
  if (!isReady || isLoading) {
    return <LoadingSpinner />;
  }

  if (showOnboarding) {
    return <Onboarding onFinish={handleOnboardingFinish} />;
  }

  return <AppRoutes />;
};

export default App;