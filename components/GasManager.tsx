
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from './Modal';
import { FireIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon, CalendarIcon, AdjustmentsHorizontalIcon } from './Icons';
import { v4 as uuidv4 } from 'uuid';
import { GasLog } from '../types';

interface GasManagerProps {
    onClose: () => void;
}

type Tab = 'STATUS' | 'HISTORY';

const GasManager: React.FC<GasManagerProps> = ({ onClose }) => {
    const { gasConfig, gasLogs, gasState, handleGasAction, handleDeleteGasLog } = useAppContext();
    const [activeTab, setActiveTab] = useState<Tab>('STATUS');
    
    // Action State
    const [actionType, setActionType] = useState<'USAGE' | 'REFILL' | null>(null);
    const [actionCount, setActionCount] = useState<number>(1);
    const [actionDate, setActionDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [manualStock, setManualStock] = useState(gasState.currentStock.toString());

    // Cylinder Visual Component
    const CylinderVisual: React.FC<{ type: 'FULL' | 'EMPTY' | 'ACTIVE', count: number, label: string }> = ({ type, count, label }) => {
        let colorClass = '';
        let bgClass = '';
        
        if (type === 'FULL') {
            colorClass = 'bg-primary dark:bg-primary-dark';
            bgClass = 'bg-primary/20 dark:bg-primary-dark/20';
        } else if (type === 'ACTIVE') {
            colorClass = 'bg-tertiary dark:bg-tertiary-dark';
            bgClass = 'bg-tertiary/20 dark:bg-tertiary-dark/20';
        } else {
            colorClass = 'bg-surface-outline/50 dark:bg-surface-outline-dark/50';
            bgClass = 'bg-surface-outline/10 dark:bg-surface-outline-dark/10';
        }

        return (
            <div className={`flex flex-col items-center p-3 rounded-2xl flex-1 ${bgClass}`}>
                <div className="flex space-x-1 mb-2 h-12 items-end justify-center">
                   {/* Draw stacks of cylinders visually */}
                   {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                       <div key={i} className={`w-3 rounded-sm ${colorClass}`} style={{ height: `${20 + (i*4)}px` }}></div>
                   ))}
                   {count > 5 && <span className="text-xs font-bold self-end mb-1 ml-1">+</span>}
                   {count === 0 && <span className="text-xs opacity-50 self-end mb-2">-</span>}
                </div>
                <span className="text-2xl font-bold text-surface-on dark:text-surface-on-dark">{count}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-surface-on-variant dark:text-surface-on-variant-dark">{label}</span>
            </div>
        );
    };

    const handleSaveAction = async () => {
        if (!actionType) return;
        
        const newLog: GasLog = {
            id: uuidv4(),
            date: actionDate, // Uses the selected date!
            type: actionType,
            count: actionCount
        };
        
        await handleGasAction(newLog);
        setActionType(null); // Reset
        setActionCount(1);
        setActionDate(new Date().toISOString().split('T')[0]); // Reset to today
    };

    const handleManualAdjustment = async () => {
        const val = parseInt(manualStock);
        if (isNaN(val)) return;

        const newLog: GasLog = {
            id: uuidv4(),
            date: new Date().toISOString(),
            type: 'ADJUSTMENT',
            count: val,
            notes: 'Manual Stock Correction'
        };
        await handleGasAction(newLog);
        setShowAdjustment(false);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    return (
        <Modal onClose={onClose} size="large">
            <div className="bg-surface-container dark:bg-surface-dark-container rounded-[28px] overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-surface-outline/10 dark:border-surface-outline-dark/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-container dark:bg-primary-container-dark text-primary-on-container dark:text-primary-on-container-dark p-2 rounded-xl">
                            <FireIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-surface-on dark:text-surface-on-dark leading-tight">Gas Manager</h2>
                            <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark">Inventory & Usage</p>
                        </div>
                    </div>
                    <div className="flex bg-surface-container-high dark:bg-surface-dark-container-high rounded-full p-1">
                        <button 
                            onClick={() => setActiveTab('STATUS')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'STATUS' ? 'bg-surface dark:bg-surface-dark shadow-sm text-surface-on dark:text-surface-on-dark' : 'text-surface-on-variant dark:text-surface-on-variant-dark opacity-70'}`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('HISTORY')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-surface dark:bg-surface-dark shadow-sm text-surface-on dark:text-surface-on-dark' : 'text-surface-on-variant dark:text-surface-on-variant-dark opacity-70'}`}
                        >
                            History
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-grow">
                    
                    {activeTab === 'STATUS' && (
                        <div className="p-4 space-y-6">
                            
                            {/* Visual Status */}
                            <div className="flex gap-3">
                                <CylinderVisual type="FULL" count={gasState.currentStock} label="Full Stock" />
                                <CylinderVisual type="ACTIVE" count={gasConfig.cylindersPerBank || 0} label="Active" />
                                <CylinderVisual type="EMPTY" count={gasState.emptyCylinders} label="Empty" />
                            </div>

                            {/* Main Actions */}
                            {!actionType ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => { setActionType('USAGE'); setActionCount(1); }}
                                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-tertiary-container dark:bg-tertiary-container-dark text-tertiary-on-container dark:text-tertiary-on-container-dark hover:opacity-90 transition-opacity active:scale-[0.98]"
                                    >
                                        <ArrowDownIcon className="w-8 h-8 mb-2" />
                                        <span className="font-bold text-base">Connect Cylinder</span>
                                        <span className="text-xs opacity-70 mt-1">Use from Stock</span>
                                    </button>

                                    <button 
                                        onClick={() => { setActionType('REFILL'); setActionCount(gasConfig.cylindersPerBank || 1); }}
                                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-surface-container-high dark:bg-surface-dark-container-high text-surface-on dark:text-surface-on-dark hover:bg-primary/10 active:scale-[0.98] transition-all"
                                    >
                                        <ArrowUpIcon className="w-8 h-8 mb-2 text-primary dark:text-primary-dark" />
                                        <span className="font-bold text-base">Refill / Buy</span>
                                        <span className="text-xs opacity-70 mt-1">Add to Stock</span>
                                    </button>
                                </div>
                            ) : (
                                // ACTION FORM (Date + Count)
                                <div className="bg-surface-container-high dark:bg-surface-dark-container-high p-5 rounded-2xl animate-fadeScale">
                                    <h3 className="text-base font-bold text-surface-on dark:text-surface-on-dark mb-4">
                                        {actionType === 'USAGE' ? 'Connect Cylinder' : 'Refill Stock'}
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-surface-on-variant dark:text-surface-on-variant-dark mb-1 ml-1 uppercase">Date of Action</label>
                                            <div className="relative">
                                                <input 
                                                    type="date" 
                                                    value={actionDate}
                                                    onChange={(e) => setActionDate(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-surface dark:bg-surface-dark rounded-xl border-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark text-surface-on dark:text-surface-on-dark font-medium"
                                                />
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-on-variant dark:text-surface-on-variant-dark" />
                                            </div>
                                            <p className="text-[11px] text-surface-on-variant dark:text-surface-on-variant-dark mt-1 ml-1 opacity-70">
                                                Forgot to add yesterday? Select yesterday's date.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-surface-on-variant dark:text-surface-on-variant-dark mb-1 ml-1 uppercase">Quantity</label>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setActionCount(Math.max(1, actionCount - 1))} className="w-12 h-12 rounded-xl bg-surface dark:bg-surface-dark flex items-center justify-center text-lg font-bold hover:bg-surface-variant/20">-</button>
                                                <div className="flex-grow h-12 rounded-xl bg-surface dark:bg-surface-dark flex items-center justify-center font-bold text-xl border border-primary/20 dark:border-primary-dark/20">
                                                    {actionCount}
                                                </div>
                                                <button onClick={() => setActionCount(actionCount + 1)} className="w-12 h-12 rounded-xl bg-surface dark:bg-surface-dark flex items-center justify-center text-lg font-bold hover:bg-surface-variant/20">+</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-6">
                                        <button onClick={() => setActionType(null)} className="flex-1 py-3 font-medium text-surface-on-variant dark:text-surface-on-variant-dark hover:bg-surface-variant/10 rounded-xl">Cancel</button>
                                        <button onClick={handleSaveAction} className="flex-1 py-3 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark font-bold rounded-xl shadow-md">
                                            Confirm {actionType === 'USAGE' ? 'Usage' : 'Refill'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="p-3 bg-surface-variant/10 rounded-xl">
                                    <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark">Avg Usage</p>
                                    <p className="text-base font-bold text-surface-on dark:text-surface-on-dark">
                                        {gasState.avgDailyUsage > 0 ? gasState.avgDailyUsage.toFixed(1) : '-'} <span className="text-[10px] font-normal opacity-70">cyl/day</span>
                                    </p>
                                </div>
                                <div className="p-3 bg-surface-variant/10 rounded-xl text-right">
                                    <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark">Est. Days Left</p>
                                    <p className="text-base font-bold text-surface-on dark:text-surface-on-dark">
                                        {gasState.projectedDaysLeft > 0 ? `~${gasState.projectedDaysLeft} Days` : '-'}
                                    </p>
                                </div>
                            </div>

                             {/* Manual Adjustment Link */}
                            <div className="text-center pt-2">
                                <button onClick={() => setShowAdjustment(!showAdjustment)} className="text-xs text-surface-on-variant/60 dark:text-surface-on-variant-dark/60 underline decoration-dashed">
                                    Stock incorrect? Fix manually
                                </button>
                            </div>

                            {showAdjustment && (
                                <div className="p-4 bg-error-container/20 dark:bg-error-container-dark/20 rounded-xl border border-error/20 dark:border-error-dark/20">
                                    <h4 className="text-sm font-bold text-error dark:text-error-dark mb-2">Manual Override</h4>
                                    <p className="text-xs mb-3 opacity-80">Force set the "Full Stock" count.</p>
                                    <div className="flex gap-2">
                                        <input type="number" value={manualStock} onChange={e => setManualStock(e.target.value)} className="w-20 p-2 rounded-lg text-center font-bold bg-surface dark:bg-surface-dark" />
                                        <button onClick={handleManualAdjustment} className="px-4 py-2 bg-error dark:bg-error-dark text-white rounded-lg text-xs font-bold">Set Stock</button>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {activeTab === 'HISTORY' && (
                        <div className="p-0">
                            {gasLogs.length === 0 ? (
                                <div className="p-10 text-center text-surface-on-variant dark:text-surface-on-variant-dark opacity-70">
                                    No history yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-surface-outline/5 dark:divide-surface-outline-dark/5">
                                    {gasLogs.map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    log.type === 'REFILL' ? 'bg-success/10 text-success' : 
                                                    log.type === 'ADJUSTMENT' ? 'bg-secondary/10 text-secondary' :
                                                    'bg-tertiary/10 text-tertiary'
                                                }`}>
                                                    {log.type === 'REFILL' ? <ArrowUpIcon className="w-5 h-5"/> : 
                                                     log.type === 'ADJUSTMENT' ? <AdjustmentsHorizontalIcon className="w-5 h-5"/> :
                                                     <ArrowDownIcon className="w-5 h-5"/>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-surface-on dark:text-surface-on-dark">
                                                        {log.type === 'REFILL' ? 'Refill' : log.type === 'ADJUSTMENT' ? 'Manual Fix' : 'Usage'}
                                                    </p>
                                                    <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark">
                                                        {formatDate(log.date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`font-bold ${log.type === 'REFILL' ? 'text-success' : 'text-surface-on dark:text-surface-on-dark'}`}>
                                                    {log.type === 'REFILL' ? '+' : ''}{log.type === 'USAGE' ? '-' : ''}{log.count}
                                                </span>
                                                <button onClick={() => handleDeleteGasLog(log.id)} className="p-2 text-surface-on-variant/50 hover:text-error dark:hover:text-error-dark transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-surface-outline/10 dark:border-surface-outline-dark/10">
                    <button onClick={onClose} className="w-full py-3 bg-surface-container-highest dark:bg-surface-dark-container-highest text-surface-on dark:text-surface-on-dark font-medium rounded-xl hover:bg-surface-variant/20 transition-colors">
                        Close Manager
                    </button>
                </div>

            </div>
        </Modal>
    );
};

export default GasManager;
