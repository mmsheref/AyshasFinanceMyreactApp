
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses, formatIndianNumberCompact } from '../utils/record-utils';
import ShareableReport from './ShareableReport';
import html2canvas from 'html2canvas';
import { shareImageFile } from '../utils/capacitor-utils';
import Modal from './Modal';
import { EyeIcon, ShareIcon, PencilSquareIcon, TrashIcon, BackIcon } from './Icons';

const RecordDetail: React.FC = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const { getRecordById, handleDelete } = useAppContext();
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  const record = useMemo(() => {
    if (recordId) return getRecordById(recordId);
    return undefined;
  }, [recordId, getRecordById]);

  if (!record) {
    return <div className="p-8 text-center text-surface-on-variant dark:text-surface-on-variant-dark">Record not found.</div>;
  }

  const totalExpenses = calculateTotalExpenses(record);
  const profit = record.totalSales - totalExpenses;
  const isProfit = profit >= 0;
  const morningSales = record.morningSales || 0;
  const nightSales = record.totalSales - morningSales;
  
  const isInProgress = !record.isClosed && !record.isCompleted;

  const handleShare = async () => {
    const reportElement = document.getElementById('shareable-report');
    if (!reportElement || isSharing) return;
    
    setIsSharing(true);
    
    try {
        const canvas = await html2canvas(reportElement, {
            scale: 2, // Higher quality
            backgroundColor: null,
            useCORS: true,
            logging: false,
        });
        
        const base64Image = canvas.toDataURL('image/png');
        const fileName = `report_${record.date}.png`;
        const title = `P&L Report - ${record.date}`;
        
        const formattedDate = new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const profitText = profit >= 0 ? `Profit: ₹${profit.toLocaleString('en-IN')}` : `Loss: ₹${Math.abs(profit).toLocaleString('en-IN')}`;
        const text = `P&L Report for ${formattedDate}. ${profitText}`;
        
        await shareImageFile(fileName, base64Image, title, text);
    } catch (error) {
        console.error("Share failed", error);
        alert("Failed to generate image for sharing.");
    } finally {
        setIsSharing(false);
    }
  };
  
  const handleDeleteRecord = async () => {
      if (confirm('Are you sure you want to delete this record? This cannot be undone.')) {
          await handleDelete(record.id);
          navigate('/records');
      }
  };

  const openPhotoViewer = (photos: string[], index: number) => {
      setViewingPhotos(photos);
      setPhotoIndex(index);
  }

  return (
    <div className="pb-8 space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-surface-container dark:bg-surface-dark-container p-2 rounded-full border border-surface-outline/10 dark:border-surface-outline-dark/10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2.5 rounded-full hover:bg-surface-container-high dark:hover:bg-surface-dark-container-high transition-colors">
            <BackIcon className="w-5 h-5 text-surface-on dark:text-surface-on-dark" />
        </button>
        <div className="flex gap-2">
            <button 
                onClick={handleShare} 
                disabled={isSharing}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-container dark:bg-secondary-container-dark text-secondary-on-container dark:text-secondary-on-container-dark rounded-full text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                <ShareIcon className="w-4 h-4" /> 
                {isSharing ? 'Sharing...' : 'Share'}
            </button>
            <button onClick={() => navigate(`/records/${record.id}/edit`)} className="p-2.5 rounded-full bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-dark hover:bg-primary/20 transition-colors">
                <PencilSquareIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className={`relative overflow-hidden p-6 rounded-[32px] shadow-sm ${record.isClosed ? 'bg-surface-container-high dark:bg-surface-dark-container-high' : (isProfit ? 'bg-gradient-to-br from-success/20 to-surface-container dark:from-success/10 dark:to-surface-dark-container' : 'bg-gradient-to-br from-error/20 to-surface-container dark:from-error/10 dark:to-surface-dark-container')}`}>
         
         {/* In Progress Banner */}
         {isInProgress && (
             <div className="absolute top-0 left-0 right-0 bg-tertiary-container dark:bg-tertiary-container-dark text-tertiary-on-container dark:text-tertiary-on-container-dark text-center text-[10px] font-bold uppercase tracking-widest py-1">
                 Entry In Progress
             </div>
         )}
         
         <p className="text-center text-xs font-bold uppercase tracking-widest text-surface-on dark:text-surface-on-dark opacity-60 mb-2 mt-2">
             {new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
         </p>
         
         {record.isClosed ? (
             <div className="text-center py-4">
                 <h2 className="text-3xl font-bold text-surface-on-variant dark:text-surface-on-variant-dark opacity-70">Shop Closed</h2>
                 <p className="text-sm mt-2 text-surface-on-variant dark:text-surface-on-variant-dark">Fixed Expenses Logged</p>
             </div>
         ) : (
            <div className="text-center">
                <p className="text-sm font-medium text-surface-on dark:text-surface-on-dark opacity-80">Net Profit</p>
                <h2 className={`text-4xl font-bold my-1 tracking-tight ${isProfit ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark'}`}>
                    {isProfit ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
                </h2>
            </div>
         )}
         
         {!record.isClosed && (
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-surface-on/5 dark:border-surface-on-dark/5">
                <div className="text-center border-r border-surface-on/5 dark:border-surface-on-dark/5">
                    <p className="text-[10px] uppercase font-bold text-surface-on-variant dark:text-surface-on-variant-dark opacity-70">Total Sales</p>
                    <p className="text-xl font-bold text-primary dark:text-primary-dark mt-1">₹{formatIndianNumberCompact(record.totalSales)}</p>
                    <div className="mt-2 text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark flex justify-center gap-2">
                        <span>M: ₹{formatIndianNumberCompact(morningSales)}</span>
                        <span>N: ₹{formatIndianNumberCompact(nightSales)}</span>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-surface-on-variant dark:text-surface-on-variant-dark opacity-70">Total Expenses</p>
                    <p className="text-xl font-bold text-error dark:text-error-dark mt-1">₹{formatIndianNumberCompact(totalExpenses)}</p>
                </div>
            </div>
         )}
      </div>

      {/* Expense List */}
      <div className="space-y-4">
          <h3 className="px-2 text-sm font-bold uppercase text-surface-on-variant dark:text-surface-on-variant-dark tracking-wider">Expense Details</h3>
          
          {record.expenses.filter(cat => cat.items.some(i => i.amount > 0)).map(category => (
            <div key={category.id} className="bg-surface-container dark:bg-surface-dark-container rounded-[24px] overflow-hidden border border-surface-outline/5 dark:border-surface-outline-dark/5">
                <div className="bg-surface-container-high/50 dark:bg-surface-dark-container-high/50 px-4 py-3 flex justify-between items-center">
                    <h4 className="font-bold text-sm text-surface-on dark:text-surface-on-dark">{category.name}</h4>
                    <span className="text-xs font-bold bg-surface/50 dark:bg-surface-dark/50 px-2 py-1 rounded-md text-surface-on-variant dark:text-surface-on-variant-dark">
                        ₹{category.items.reduce((sum, i) => sum + (i.amount||0), 0).toLocaleString('en-IN')}
                    </span>
                </div>
                
                <ul className="divide-y divide-surface-outline/5 dark:divide-surface-outline-dark/5 bg-surface-container-low dark:bg-surface-dark-container-low">
                    {category.items.map(item => item.amount > 0 && (
                        <li key={item.id} className="px-3 py-2 flex justify-between items-center text-sm">
                            <span className="text-surface-on dark:text-surface-on-dark flex-1 pr-2 break-words">{item.name}</span>
                            <div className="flex items-center space-x-3 flex-shrink-0">
                                {(item.billPhotos && item.billPhotos.length > 0) && (
                                    <button onClick={() => openPhotoViewer(item.billPhotos!, 0)} className="relative text-primary dark:text-primary-dark hover:text-primary/80" aria-label="View bill photos">
                                        <EyeIcon className="w-5 h-5" />
                                        {item.billPhotos.length > 1 && (
                                            <span className="absolute -top-1.5 -right-2.5 bg-secondary dark:bg-secondary-dark text-white dark:text-surface-on-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-surface-dark-container-low">{item.billPhotos.length}</span>
                                        )}
                                    </button>
                                )}
                                <span className="font-medium text-surface-on dark:text-surface-on-dark w-20 text-right">₹{item.amount.toLocaleString('en-IN')}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
          ))}
      </div>

      <div className="pt-4">
        <button onClick={handleDeleteRecord} className="w-full py-4 rounded-[20px] text-error dark:text-error-dark font-bold text-sm bg-error-container/20 dark:bg-error-container-dark/20 hover:bg-error-container/30 transition-colors flex items-center justify-center gap-2">
            <TrashIcon className="w-5 h-5" />
            Delete Record
        </button>
      </div>

      {/* Hidden Report for Generation (Fixed Position Off-screen) */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -1 }}>
        <ShareableReport record={record} id="shareable-report" />
      </div>

      {viewingPhotos && (
        <Modal onClose={() => setViewingPhotos(null)}>
            <div className="relative bg-black/90 flex items-center justify-center">
                <img 
                    src={viewingPhotos[photoIndex]} 
                    alt="Bill" 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg" 
                />
                
                {/* Navigation Controls */}
                {viewingPhotos.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                         <button 
                            onClick={() => setPhotoIndex(prev => (prev - 1 + viewingPhotos.length) % viewingPhotos.length)}
                            className="p-3 bg-white/20 text-white rounded-full backdrop-blur-md hover:bg-white/30"
                         >
                            ←
                         </button>
                         <span className="px-3 py-1.5 bg-black/50 text-white rounded-full text-sm font-medium self-center">
                            {photoIndex + 1} / {viewingPhotos.length}
                         </span>
                         <button 
                            onClick={() => setPhotoIndex(prev => (prev + 1) % viewingPhotos.length)}
                            className="p-3 bg-white/20 text-white rounded-full backdrop-blur-md hover:bg-white/30"
                         >
                            →
                         </button>
                    </div>
                )}
            </div>
        </Modal>
      )}
    </div>
  );
};

export default RecordDetail;
