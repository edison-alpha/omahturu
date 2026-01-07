import React, { useState, useEffect } from 'react';
import { Bell, Shield, FileText, Globe, LogOut, ChevronRight, User as UserIcon, X, Camera, Mail, Phone, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut, getCurrentUser, updateCurrentUser, User } from '../lib/storage';
import { Button } from '../components/ui/Button';

export const Profile = () => {
  const navigate = useNavigate();
  
  // User State
  const [user, setUser] = useState<User | null>(null);

  // Settings State
  const [language, setLanguage] = useState('English');
  const [activeSheet, setActiveSheet] = useState<'none' | 'personal_info' | 'language'>('none');

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  const handleSignOut = () => {
    signOut();
    // Redirect to root (Onboarding) to reset the flow
    navigate('/', { replace: true });
  };

  const openSheet = (sheet: 'personal_info' | 'language') => {
    if (user) {
        setFormData(user); 
        setActiveSheet(sheet);
    }
  };

  const savePersonalInfo = () => {
    try {
        const updated = updateCurrentUser(formData);
        setUser(updated);
        setActiveSheet('none');
    } catch (e) {
        console.error("Failed to update user", e);
    }
  };

  const menuItems = [
    { 
        icon: UserIcon, 
        label: 'Personal Information', 
        action: () => openSheet('personal_info')
    },
    { icon: Bell, label: 'Notifications' }, // No action yet
    { icon: Shield, label: 'Privacy Policy' },
    { icon: FileText, label: 'Terms & Conditions' },
    { 
        icon: Globe, 
        label: 'Language', 
        value: language, 
        action: () => openSheet('language')
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50 pb-32 relative">
      {/* Header */}
      <div className="bg-white p-6 pt-[calc(env(safe-area-inset-top,24px)+24px)] pb-8 rounded-b-[2rem] shadow-sm">
         <div className="flex justify-between items-center mb-6">
             <h1 className="text-2xl font-bold text-stone-800">My Profile</h1>
             <button 
                onClick={() => openSheet('personal_info')}
                className="px-4 py-1.5 rounded-full border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
             >
                Edit
             </button>
         </div>

         <div className="flex items-center gap-4">
             <div className="relative">
                 <div className="w-16 h-16 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-md">
                     <img src={user.avatar || 'https://i.pravatar.cc/150'} alt="Profile" className="w-full h-full object-cover" />
                 </div>
                 <button 
                    onClick={() => openSheet('personal_info')}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-earth-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm"
                 >
                    <Camera size={12} />
                 </button>
             </div>
             <div>
                 <h2 className="text-lg font-bold text-stone-800">{user.name}</h2>
                 <p className="text-stone-400 text-sm">{user.email}</p>
             </div>
         </div>
      </div>

      <div className="p-6">
          {/* Menu Items */}
          <div className="flex flex-col gap-3">
              {menuItems.map((item, index) => (
                  <button 
                    key={index} 
                    onClick={item.action}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-stone-50 active:scale-98 transition-transform hover:bg-stone-50/50"
                  >
                      <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-earth-600">
                          <item.icon size={16} />
                      </div>
                      <span className="flex-1 text-left font-medium text-stone-700 text-sm">{item.label}</span>
                      {item.value && <span className="text-stone-400 text-xs mr-2">{item.value}</span>}
                      <ChevronRight size={16} className="text-stone-300" />
                  </button>
              ))}
          </div>
          
          <div className="mt-8 flex justify-center">
             <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 text-stone-400 text-sm font-medium hover:text-red-500 transition-colors px-6 py-3 rounded-xl active:bg-stone-100"
             >
                 <LogOut size={16} />
                 Sign Out
             </button>
          </div>
      </div>

      {/* Sheets / Modals */}
      <AnimatePresence>
        {activeSheet !== 'none' && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setActiveSheet('none')}
                    className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50"
                />
                <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-6 pb-12 z-50 max-w-md mx-auto max-h-[90vh] overflow-y-auto"
                >
                    <div className="w-12 h-1.5 bg-stone-100 rounded-full mx-auto mb-6"></div>
                    
                    {activeSheet === 'personal_info' && (
                        <div>
                             <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-stone-800">Edit Profile</h2>
                                <button onClick={() => setActiveSheet('none')} className="p-2 rounded-full hover:bg-stone-50 text-stone-400"><X size={20}/></button>
                            </div>

                            <div className="flex flex-col items-center mb-8">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-stone-200 overflow-hidden border-4 border-white shadow-md">
                                        <img src={formData.avatar || 'https://i.pravatar.cc/150'} alt="Profile" className="w-full h-full object-cover" />
                                    </div>
                                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm active:scale-95 transition-transform">
                                        <Camera size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block ml-1">Full Name</label>
                                    <div className="flex items-center gap-3 px-4 h-14 bg-stone-50 rounded-2xl border border-stone-100 focus-within:border-earth-500 focus-within:ring-1 focus-within:ring-earth-500 transition-all">
                                        <UserIcon size={18} className="text-stone-400" />
                                        <input 
                                            type="text" 
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="flex-1 bg-transparent border-none outline-none font-medium text-stone-800 placeholder-stone-400"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block ml-1">Email Address</label>
                                    <div className="flex items-center gap-3 px-4 h-14 bg-stone-50 rounded-2xl border border-stone-100 focus-within:border-earth-500 focus-within:ring-1 focus-within:ring-earth-500 transition-all">
                                        <Mail size={18} className="text-stone-400" />
                                        <input 
                                            type="email" 
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="flex-1 bg-transparent border-none outline-none font-medium text-stone-800 placeholder-stone-400"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block ml-1">Phone Number</label>
                                    <div className="flex items-center gap-3 px-4 h-14 bg-stone-50 rounded-2xl border border-stone-100 focus-within:border-earth-500 focus-within:ring-1 focus-within:ring-earth-500 transition-all">
                                        <Phone size={18} className="text-stone-400" />
                                        <input 
                                            type="tel" 
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            placeholder="+62"
                                            className="flex-1 bg-transparent border-none outline-none font-medium text-stone-800 placeholder-stone-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button fullWidth onClick={savePersonalInfo} className="rounded-2xl">
                                Save Changes
                            </Button>
                        </div>
                    )}

                    {activeSheet === 'language' && (
                        <div>
                             <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-stone-800">Select Language</h2>
                                <button onClick={() => setActiveSheet('none')} className="p-2 rounded-full hover:bg-stone-50 text-stone-400"><X size={20}/></button>
                            </div>
                            
                            <div className="space-y-3">
                                {['English', 'Bahasa Indonesia'].map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => {
                                            setLanguage(lang);
                                            setActiveSheet('none');
                                        }}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${language === lang ? 'bg-earth-50 border-earth-500 ring-1 ring-earth-500' : 'bg-white border-stone-100 hover:bg-stone-50'}`}
                                    >
                                        <span className={`font-medium ${language === lang ? 'text-earth-700' : 'text-stone-700'}`}>{lang}</span>
                                        {language === lang && <div className="w-6 h-6 rounded-full bg-earth-500 text-white flex items-center justify-center"><Check size={14} /></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
};