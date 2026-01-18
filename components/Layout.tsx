
import React from 'react';
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { PlusIcon, HomeIcon, ListIcon, BackIcon, SettingsIcon, ChartBarIcon } from './Icons';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getHeaderText = () => {
        const path = location.pathname;
        if (path === '/') return ''; // Dashboard has its own large header
        if (path.startsWith('/records/new')) return 'New Record';
        if (path.startsWith('/records/') && path.endsWith('/edit')) return 'Edit Record';
        if (path.startsWith('/records/')) return 'Details';
        if (path === '/records') return 'History';
        if (path === '/settings') return 'Settings';
        if (path === '/reports') return 'Analytics';
        return "Ayshas Finance Tracker";
    };

    const isFormPage = location.pathname.includes('/new') || location.pathname.includes('/edit');
    const isRootPage = ['/', '/records', '/reports', '/settings'].includes(location.pathname);
    const isDashboard = location.pathname === '/';
    const showBottomNav = !isFormPage;

    const handleBack = () => navigate(-1);

    // MD3 Navigation Bar Item
    const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
        <NavLink to={to} className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full gap-1 group active:scale-95 transition-transform duration-100`}>
            {({ isActive }) => (
                <>
                    <div className={`relative w-12 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${isActive ? 'bg-primary-container dark:bg-primary-container-dark text-primary-on-container dark:text-primary-on-container-dark' : 'bg-transparent text-surface-on-variant dark:text-surface-on-variant-dark'}`}>
                        {icon}
                    </div>
                    <span className={`text-[11px] font-medium transition-colors ${isActive ? 'text-surface-on dark:text-surface-on-dark font-bold' : 'text-surface-on-variant dark:text-surface-on-variant-dark'}`}>
                        {label}
                    </span>
                </>
            )}
        </NavLink>
    );

    return (
        <div className="min-h-screen font-sans flex flex-col bg-surface dark:bg-surface-dark text-surface-on dark:text-white">
            {/* Top App Bar (Only for non-dashboard pages) */}
            {!isDashboard && (
                <header className="sticky top-0 z-30 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md pt-[env(safe-area-inset-top)] px-4 h-[64px] flex items-center justify-between border-b border-surface-outline/5 dark:border-surface-outline-dark/5">
                    <div className="flex items-center w-full">
                        {!isRootPage && (
                            <button onClick={handleBack} className="p-2 mr-2 -ml-2 rounded-full hover:bg-surface-variant/30 active:bg-surface-variant/50 transition-colors" aria-label="Go back">
                                <BackIcon className="w-6 h-6 text-surface-on dark:text-white" />
                            </button>
                        )}
                        <h1 className="text-xl font-semibold tracking-tight text-surface-on dark:text-white flex-grow truncate">
                            {getHeaderText()}
                        </h1>
                    </div>
                </header>
            )}
            
            {/* Main Content */}
            <main 
                className={`flex-grow px-4 pb-32 animate-fadeScale ${isDashboard ? 'pt-[calc(env(safe-area-inset-top)+1.5rem)]' : 'pt-4'}`}
            >
                <Outlet />
            </main>

            {/* MD3 Bottom Navigation Bar with Glassmorphism */}
            {showBottomNav && (
                <nav className="fixed bottom-0 left-0 right-0 bg-surface-container/85 dark:bg-surface-dark-container/85 backdrop-blur-xl z-40 border-t border-surface-outline/10 dark:border-surface-outline-dark/10 pb-[env(safe-area-inset-bottom)] h-[84px] flex items-center justify-between px-4 shadow-[0_-4px_30px_rgba(0,0,0,0.03)]">
                    <NavItem to="/" icon={<HomeIcon className="w-5 h-5" />} label="Home" />
                    <NavItem to="/records" icon={<ListIcon className="w-5 h-5" />} label="Records" />
                    <NavItem to="/reports" icon={<ChartBarIcon className="w-5 h-5" />} label="Reports" />
                    <NavItem to="/settings" icon={<SettingsIcon className="w-5 h-5" />} label="Settings" />
                </nav>
            )}

            {/* Floating Action Button (FAB) */}
            {['/', '/records'].includes(location.pathname) && (
                <div className="fixed bottom-[100px] right-5 z-50">
                    <button
                        onClick={() => navigate('/records/new')}
                        className="group relative w-14 h-14 bg-primary-container dark:bg-primary-container-dark text-primary-on-container dark:text-primary-on-container-dark rounded-[18px] shadow-lg shadow-primary/20 flex items-center justify-center transition-all duration-200 active:scale-90 active:shadow-sm"
                        aria-label="Add New Record"
                    >
                        <PlusIcon className="h-7 w-7 transition-transform group-active:rotate-90" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Layout;
