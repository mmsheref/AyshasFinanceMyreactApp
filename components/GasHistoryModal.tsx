
import React from 'react';
import Modal from './Modal';
import { useAppContext } from '../context/AppContext';
import { ArrowUpIcon, ArrowDownIcon, FireIcon } from './Icons';

interface GasHistoryModalProps {
    onClose: () => void;
}

const GasHistoryModal: React.FC<GasHistoryModalProps> = ({ onClose }) => {
    const { gasLogs } = useAppContext();

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Modal onClose={onClose}>
            <div className="bg-surface-container dark:bg-surface-dark-container rounded-[28px] max-h-[85vh] flex flex-col">
                <div className="p-6 border-b border-surface-outline/10 dark:border-surface-outline-dark/10">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-tertiary-container dark:bg-tertiary-container-dark text-tertiary-on-container dark:text-tertiary-on-container-dark p-2 rounded-xl">
                            <FireIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-surface-on dark:text-surface-on-dark">Gas History</h2>
                    </div>
                    <p className="text-sm text-surface-on-variant dark:text-surface-on-variant-dark pl-1">
                        Log of connections and refills.
                    </p>
                </div>

                <div className="overflow-y-auto flex-grow p-4">
                    {gasLogs.length === 0 ? (
                        <div className="text-center py-10 text-surface-on-variant dark:text-surface-on-variant-dark opacity-70">
                            No history available yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {gasLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-3 bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                                            log.type === 'REFILL' 
                                            ? 'bg-success/10 text-success dark:text-success-dark' 
                                            : 'bg-error/10 text-error dark:text-error-dark'
                                        }`}>
                                            {log.type === 'REFILL' ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-surface-on dark:text-surface-on-dark text-sm">
                                                {log.type === 'REFILL' ? 'Stock Refilled' : 'Connected to Stove'}
                                            </p>
                                            <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark">
                                                {formatDate(log.date)} • {formatTime(log.date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-lg font-bold ${
                                            log.type === 'REFILL' 
                                            ? 'text-success dark:text-success-dark' 
                                            : 'text-surface-on dark:text-surface-on-dark'
                                        }`}>
                                            {log.type === 'REFILL' ? '+' : ''}{log.count}
                                        </span>
                                        <p className="text-[10px] uppercase font-bold text-surface-on-variant dark:text-surface-on-variant-dark opacity-70">Cylinders</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-surface-outline/10 dark:border-surface-outline-dark/10 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-surface-container-highest dark:bg-surface-dark-container-highest text-surface-on dark:text-surface-on-dark rounded-full font-medium text-sm hover:opacity-80 transition-opacity">
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default GasHistoryModal;
