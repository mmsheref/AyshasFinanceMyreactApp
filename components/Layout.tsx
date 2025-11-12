import React from 'react';
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { PlusIcon, HomeIcon, ListIcon, BackIcon, SettingsIcon } from './Icons';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getHeaderText = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/records/new')) return 'New Record';
        if (path.startsWith('/records/') && path.endsWith('/edit')) return 'Edit Record';
        if (path.startsWith('/records/')) return 'Record Details';
        if (path === '/records') return 'All Records';
        if (path === '/settings') return 'Settings';
        return "Aysha's P&L";
    };

    const isFormPage = location.pathname.includes('/new') || location.pathname.includes('/edit');
    const showBackButton = location.pathname !== '/' && location.pathname !== '/records';
    const showBottomNav = !isFormPage;

    const handleBack = () => navigate(-1);

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex flex-col items-center justify-center w-full h-full transition-colors ${
            isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-primary'
        }`;

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
            <main 
                key={location.pathname}
                className={`container mx-auto p-4 flex-grow animate-fadeInUp ${showBottomNav ? "pb-[calc(5rem+env(safe-area-inset-bottom))]" : ""}`}
                style={{ animationDuration: '0.4s' }}
            >
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            {showBottomNav && (
                <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-30 border-t border-slate-200/80 dark:border-slate-800/80 pb-[env(safe-area-inset-bottom)]">
                    <div className="container mx-auto h-16 grid grid-cols-3 items-center">
                        <NavLink to="/" className={navLinkClass} aria-label="Dashboard">
                            <HomeIcon className="w-6 h-6 mb-1" />
                            <span className="text-xs font-medium">Dashboard</span>
                        </NavLink>
                        <NavLink to="/records" className={navLinkClass} aria-label="Records">
                            <ListIcon className="w-6 h-6 mb-1" />
                            <span className="text-xs font-medium">Records</span>
                        </NavLink>
                        <NavLink to="/settings" className={navLinkClass} aria-label="Settings">
                            <SettingsIcon className="w-6 h-6 mb-1" />
                            <span className="text-xs font-medium">Settings</span>
                        </NavLink>
                    </div>
                </nav>
            )}

            {['/', '/records'].includes(location.pathname) && (
                <div className="fixed bottom-[calc(5rem)] left-1/2 -translate-x-1/2 z-40 pb-[env(safe-area-inset-bottom)]">
                    <button
                        onClick={() => navigate('/records/new')}
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

export default Layout;