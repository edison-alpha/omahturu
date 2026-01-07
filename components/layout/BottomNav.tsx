import React from 'react';
import { Home, Heart, Calendar, User, Compass } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on onboarding, detail pages, and auth pages
  const hiddenPaths = [
    '/', 
    '/signin',
    '/signup'
  ];

  if (
    hiddenPaths.includes(location.pathname) || 
    location.pathname.includes('/villa/') || 
    location.pathname.includes('/booking/')
  ) return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Compass, label: 'Explore', path: '/see-all/all' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: Calendar, label: 'Bookings', path: '/bookings' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 px-6 z-40 pointer-events-none">
      <div className="bg-[#3c2f2c] backdrop-blur-xl rounded-[2rem] h-[5.5rem] px-2 shadow-2xl shadow-stone-900/40 flex items-center justify-between max-w-sm mx-auto pointer-events-auto ring-1 ring-white/10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.label === 'Explore' && location.pathname.startsWith('/see-all/'));
          
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex-1 flex flex-col items-center justify-center h-full gap-1 group"
            >
              <div className={`
                w-11 h-11 flex items-center justify-center rounded-[1.2rem] transition-all duration-300
                ${isActive ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/5' : 'bg-transparent text-[#9ca3af] group-hover:text-white/70'}
              `}>
                <item.icon 
                  size={22} 
                  strokeWidth={isActive ? 2 : 2}
                  fill={isActive ? "currentColor" : "none"}
                  className={`transition-transform duration-300 ${isActive ? 'scale-105' : ''}`}
                />
              </div>
              <span className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#857d7a]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};