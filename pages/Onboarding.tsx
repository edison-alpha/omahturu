import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { ChevronRight } from 'lucide-react';
import { completeOnboarding } from '../lib/storage';
import brandingLogo from '../branding.png';

const ONBOARDING_DATA = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=1200&auto=format&fit=crop',
    title: 'Welcome to Omah Turu',
    subtitle: 'Tawangmangu, Central Java',
    description: 'A sanctuary in the pines. Experience the cool air of Gondosuli in our luxury cabins and glamping tents.',
    highlightWord: 'Turu',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
    title: 'Forest & Earth Comfort',
    subtitle: 'Designed for rest',
    description: 'Immerse yourself in nature without compromising on comfort. Minimalist, warm, and distinctly Javanese.',
    highlightWord: 'Comfort',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1200&auto=format&fit=crop',
    title: 'Your Escape Awaits',
    subtitle: 'Ready to explore?',
    description: 'Join us today. Unwind, recharge, and breathe in the fresh mountain air.',
    highlightWord: 'Escape',
  },
];

export const Onboarding = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleComplete = (path: string) => {
    completeOnboarding();
    // Use replace: true to prevent the user from going back to onboarding
    navigate(path, { replace: true });
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const renderTitle = (title: string, highlight: string) => {
    const parts = title.split(highlight);
    return (
      <>
        {parts[0]}
        <span className="font-serif italic text-earth-300 block text-4xl mt-1 mb-1">{highlight}</span>
        {parts[1]}
      </>
    );
  };

  const isLastSlide = currentIndex === ONBOARDING_DATA.length - 1;

  return (
    <div className="fixed inset-0 bg-stone-900 overflow-hidden flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Background Images with Crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
            key={`bg-${currentIndex}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 z-0"
        >
            <img
                src={ONBOARDING_DATA[currentIndex].image}
                alt="Background"
                className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Top Bar - dengan safe area untuk status bar */}
      <div className="absolute top-0 left-0 right-0 pt-[env(safe-area-inset-top,54px)] px-4 pb-2 z-20 flex justify-between items-center">
         <div className="inline-flex items-center gap-2">
             <img src={brandingLogo} alt="Omah Turu" className="h-8 w-auto object-contain" />
          </div>
          {!isLastSlide && (
             <button 
               onClick={() => handleComplete('/signin')} 
               className="text-white/70 text-sm font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-all backdrop-blur-sm"
             >
               Skip
             </button>
          )}
      </div>

      {/* Content - dengan safe area untuk home indicator */}
      <div className="relative z-10 flex-1 flex flex-col justify-end pb-[calc(env(safe-area-inset-bottom,34px)+16px)] px-4">
        {/* Text Content */}
        <AnimatePresence mode="wait">
            <motion.div
                key={`content-${currentIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6"
            >
                <span className="inline-block px-3 py-1 rounded-full bg-earth-500/20 border border-earth-500/30 text-earth-200 text-xs font-semibold tracking-widest uppercase mb-3 backdrop-blur-md shadow-sm">
                    {ONBOARDING_DATA[currentIndex].subtitle}
                </span>
                <h1 className="text-3xl font-light text-white leading-[1.1] mb-3 tracking-tight">
                    {renderTitle(ONBOARDING_DATA[currentIndex].title, ONBOARDING_DATA[currentIndex].highlightWord)}
                </h1>
                <p className="text-stone-200 text-sm leading-relaxed max-w-xs font-light opacity-90">
                    {ONBOARDING_DATA[currentIndex].description}
                </p>
            </motion.div>
        </AnimatePresence>

        {/* Progress Indicators */}
        <div className="flex gap-2 mb-6">
            {ONBOARDING_DATA.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-8 bg-earth-500' : 'w-2 bg-stone-600/50'}`}
                />
            ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {isLastSlide ? (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-3"
             >
                <Button
                    fullWidth
                    size="lg"
                    onClick={() => handleComplete('/signup')}
                    className="bg-earth-500 hover:bg-earth-600 text-white border-none h-12 rounded-[2rem] shadow-xl shadow-earth-500/20 font-semibold text-base"
                >
                    Create Account
                </Button>
                <Button
                    fullWidth
                    size="lg"
                    variant="ghost"
                    onClick={() => handleComplete('/signin')}
                    className="bg-white/10 hover:bg-white/20 !text-white border border-white/10 backdrop-blur-sm h-12 rounded-[2rem]"
                >
                    Log In
                </Button>
             </motion.div>
          ) : (
            <Button
                fullWidth
                size="lg"
                onClick={handleNext}
                className="bg-earth-500 hover:bg-earth-600 text-white border-none flex items-center justify-between pl-6 pr-4 group h-14 rounded-[2rem] shadow-xl shadow-earth-500/20"
            >
                <span className="text-base font-medium">Continue</span>
                <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <ChevronRight size={18} />
                </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};