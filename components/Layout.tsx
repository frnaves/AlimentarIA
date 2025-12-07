import React, { ReactNode } from 'react';
import { DateSelector } from './DateSelector';
import { Link, useLocation } from 'react-router-dom';
import { Home, Utensils, Activity, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { userProfile } = useStore();
  
  const isActive = (path: string) => location.pathname === path ? "text-emerald-600" : "text-gray-400";
  const isOnboarding = location.pathname === '/onboarding';

  // If on onboarding, just render children without nav
  if (isOnboarding) {
      return (
          <div className="min-h-screen bg-white flex flex-col">
              <main className="flex-1 p-6 max-w-md mx-auto w-full flex flex-col justify-center">
                  {children}
              </main>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <DateSelector />
      
      <main className="flex-1 p-4 max-w-md mx-auto w-full animate-fade-in">
        {children}
      </main>

      {/* Bottom Navigation - Only show if onboarding completed */}
      {userProfile.onboarding_completed && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-50 h-20 flex justify-around items-center px-4 max-w-md mx-auto">
            <Link to="/" className={`flex flex-col items-center p-2 transition-colors ${isActive('/')}`}>
              <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">Início</span>
            </Link>
            <Link to="/nutrition" className={`flex flex-col items-center p-2 transition-colors ${isActive('/nutrition')}`}>
              <Utensils size={24} strokeWidth={isActive('/nutrition') ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">Diário</span>
            </Link>
            <Link to="/body" className={`flex flex-col items-center p-2 transition-colors ${isActive('/body')}`}>
              <Activity size={24} strokeWidth={isActive('/body') ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">Corpo</span>
            </Link>
            <Link to="/profile" className={`flex flex-col items-center p-2 transition-colors ${isActive('/profile')}`}>
              <User size={24} strokeWidth={isActive('/profile') ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">Perfil</span>
            </Link>
          </nav>
      )}
    </div>
  );
};