
import React from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-xl md:max-w-none md:shadow-none">
      {/* Header */}
      <header className="bg-indigo-700 text-white p-4 sticky top-0 z-30 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded">
             <i className="fas fa-bolt text-indigo-700 text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight">AKTIVATE</h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium hidden sm:inline">{user.full_name}</span>
            <button 
              onClick={onLogout}
              className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-full transition-colors"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 sm:pb-4 p-4">
        {children}
      </main>

      {/* Mobile Nav */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 sm:hidden z-40 max-w-md mx-auto">
          <button className="flex flex-col items-center text-indigo-600">
            <i className="fas fa-home text-xl"></i>
            <span className="text-[10px] mt-1">Dashboard</span>
          </button>
          <button className="flex flex-col items-center text-slate-400">
            <i className="fas fa-calendar-alt text-xl"></i>
            <span className="text-[10px] mt-1">History</span>
          </button>
          <button className="flex flex-col items-center text-slate-400">
            <i className="fas fa-bell text-xl"></i>
            <span className="text-[10px] mt-1">Alerts</span>
          </button>
          <button className="flex flex-col items-center text-slate-400">
            <i className="fas fa-user text-xl"></i>
            <span className="text-[10px] mt-1">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default Layout;
