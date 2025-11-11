import React, { useState, useEffect } from 'react';
import { DailyRecord, CustomExpenseStructure, BackupData, ExpenseCategory } from './types';
import Dashboard from './components/Dashboard';
import RecordList from './components/RecordList';
import RecordForm from './components/RecordForm';
import RecordDetail from './components/RecordDetail';
import { PlusIcon, HomeIcon, ListIcon, BackIcon, SettingsIcon } from './components/Icons';
import { DEFAULT_EXPENSE_STRUCTURE } from './constants';
import SettingsPage from './components/SettingsPage';

type View = 'dashboard' | 'records' | 'form' | 'detail' | 'settings';

const App: React.FC = () => {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [customStructure, setCustomStructure] = useState<CustomExpenseStructure>({});
  const [view, setView] = useState<View>('dashboard');
  const [lastView, setLastView] = useState<View>('dashboard');
  const [currentRecord, setCurrentRecord] = useState<DailyRecord | null>(null);

  // Effect to handle system dark mode changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme(mediaQuery.matches); // Apply theme on initial load

    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const runMigration = (recordsToMigrate: DailyRecord[]): { migratedRecords: DailyRecord[], needsUpdate: boolean } => {
    let needsUpdate = false;
    const migratedRecords = JSON.parse(JSON.stringify(recordsToMigrate)); // Deep copy

    migratedRecords.forEach((rec: DailyRecord) => {
        rec.expenses.forEach((cat: ExpenseCategory) => {
            // This `any` is for safely checking old property `billPhoto`
            cat.items.forEach((item: any) => {
                if (item.billPhoto && (!item.billPhotos || item.billPhotos.length === 0)) {
                    item.billPhotos = [item.billPhoto];
                    delete item.billPhoto;
                    needsUpdate = true;
                }
            });
        });
    });
    return { migratedRecords, needsUpdate };
  };

  useEffect(() => {
    try {
      const storedRecords = localStorage.getItem('ayshas-records');
      if (storedRecords) {
        const parsedRecords: DailyRecord[] = JSON.parse(storedRecords);
        const { migratedRecords, needsUpdate } = runMigration(parsedRecords);
        setRecords(migratedRecords);

        if (needsUpdate) {
            console.log("Migrating records to new billPhotos format.");
            localStorage.setItem('ayshas-records', JSON.stringify(migratedRecords));
        }
      }
      
      const storedStructure = localStorage.getItem('ayshas-custom-structure');
      if (storedStructure) {
        setCustomStructure(JSON.parse(storedStructure));
      } else {
        const initialStructure: CustomExpenseStructure = {};
        DEFAULT_EXPENSE_STRUCTURE.forEach(cat => {
            initialStructure[cat.name] = cat.items.map(item => item.name);
        });
        setCustomStructure(initialStructure);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ayshas-records', JSON.stringify(records));
    } catch (error) {
      console.error("Failed to save records to localStorage", error);
    }
  }, [records]);

  useEffect(() => {
    try {
        localStorage.setItem('ayshas-custom-structure', JSON.stringify(customStructure));
    } catch (error) {
        console.error("Failed to save custom structure to localStorage", error);
    }
  }, [customStructure]);

  const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const navigate = (newView: View, record: DailyRecord | null = null) => {
    if (newView !== view && view !== 'form' && view !== 'detail') {
        setLastView(view);
    }
    setCurrentRecord(record);
    setView(newView);
    window.scrollTo(0, 0); // Scroll to top on view change
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setRecords(records.filter(r => r.id !== id));
      navigate('records');
    }
  };

  const handleSave = (record: DailyRecord) => {
    const exists = records.some(r => r.id === record.id);
    if (exists) {
      setRecords(records.map(r => (r.id === record.id ? record : r)));
    } else {
      setRecords([...records, record]);
    }
    navigate('detail', record);
  };
  
  const handleSaveCustomItem = (categoryName: string, itemName: string) => {
    setCustomStructure(prev => {
        const newStructure = { ...prev };
        if (newStructure[categoryName] && !newStructure[categoryName].includes(itemName)) {
            newStructure[categoryName] = [...newStructure[categoryName], itemName];
        }
        return newStructure;
    });
  };
  
  const handleRestore = (data: BackupData) => {
    const { migratedRecords } = runMigration(data.records);
    setRecords(migratedRecords);
    setCustomStructure(data.customStructure);
    alert(`Successfully restored ${data.records.length} records.`);
    navigate('dashboard');
  };

  const renderView = () => {
    switch (view) {
      case 'form':
        return <RecordForm 
                  record={currentRecord} 
                  onSave={handleSave} 
                  onCancel={() => navigate(currentRecord ? 'detail' : lastView, currentRecord)} 
                  allRecords={sortedRecords} 
                  customStructure={customStructure}
                  onSaveCustomItem={handleSaveCustomItem}
                />;
      case 'detail':
        return currentRecord && <RecordDetail record={currentRecord} onDelete={handleDelete} onEdit={(r) => navigate('form', r)} />;
      case 'records':
        return <RecordList records={sortedRecords} onView={(r) => navigate('detail', r)} />;
      case 'settings':
        return <SettingsPage allRecords={records} customStructure={customStructure} onRestore={handleRestore} />;
      case 'dashboard':
      default:
        return <Dashboard records={sortedRecords} onViewRecord={(r) => navigate('detail', r)} />;
    }
  };

  const getHeaderText = () => {
    switch (view) {
      case 'dashboard': return 'Dashboard';
      case 'records': return 'All Records';
      case 'form': return currentRecord ? 'Edit Record' : 'New Record';
      case 'detail': return 'Record Details';
      case 'settings': return 'Settings';
      default: return "Aysha's P&L";
    }
  };

  const showBackButton = ['form', 'detail', 'settings'].includes(view);
  const handleBack = () => {
    if (view === 'detail') navigate('records');
    else if (view === 'form' && currentRecord) navigate('detail', currentRecord);
    else if (view === 'form' && !currentRecord) navigate(lastView);
    else if (view === 'settings') navigate(lastView);
    else navigate('dashboard');
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white sticky top-0 z-20 pt-[env(safe-area-inset-top)] dark:border-b dark:border-slate-800">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center w-1/3">
            {showBackButton ? (
              <button onClick={handleBack} className="p-2 -ml-2 mr-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Go back">
                <BackIcon className="w-6 h-6" />
              </button>
            ) : null}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-center w-1/3 truncate">
            {getHeaderText()}
          </h1>
          <div className="flex items-center justify-end w-1/3">
            {/* Placeholder for potential future icons */}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto p-4 flex-grow pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-30 border-t border-slate-200/80 dark:border-slate-800/80 pb-[env(safe-area-inset-bottom)]">
        <div className="container mx-auto h-16 grid grid-cols-3 items-center">
            <button onClick={() => navigate('dashboard')} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === 'dashboard' ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-primary'}`} aria-label="Dashboard">
              <HomeIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Dashboard</span>
            </button>
            <button onClick={() => navigate('records')} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === 'records' ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-primary'}`} aria-label="Records">
              <ListIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Records</span>
            </button>
            <button onClick={() => navigate('settings')} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === 'settings' ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-primary'}`} aria-label="Settings">
              <SettingsIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Settings</span>
            </button>
        </div>
      </nav>

       {['dashboard', 'records'].includes(view) && (
        <div className="fixed bottom-[calc(5rem)] left-1/2 -translate-x-1/2 z-40 pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={() => navigate('form')}
              className="w-16 h-16 bg-secondary hover:bg-primary text-white rounded-full p-4 shadow-lg transition-transform duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-4 focus:ring-secondary/30"
              aria-label="Add New Record"
            >
              <PlusIcon className="h-8 w-8" />
            </button>
        </div>
      )}
    </div>
  );
};

export default App;