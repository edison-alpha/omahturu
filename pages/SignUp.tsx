import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { signUp } from '../lib/storage';

export const SignUp = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      try {
        signUp(formData);
        navigate('/home', { replace: true });
      } catch (err: any) {
        setError(err.message || 'Failed to create account');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-100 via-earth-50 to-stone-50 px-6 py-6 flex flex-col relative overflow-hidden font-sans">
      
      {/* Cloud Decorations */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute -top-10 -right-20 w-64 h-64 bg-earth-200/40 rounded-full blur-3xl" 
      />
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        className="absolute top-20 -left-20 w-72 h-40 bg-earth-300/30 rounded-full blur-2xl" 
      />

      {/* Back Button */}
      <div className="relative z-20 mb-6 pt-[env(safe-area-inset-top,24px)]">
        <button 
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-stone-700 hover:bg-white/50 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex-1 flex flex-col max-w-sm mx-auto w-full"
      >
        {/* Header */}
        <div className="text-center mb-8 mt-2">
          <h1 className="text-3xl font-bold text-stone-800 mb-2 tracking-tight drop-shadow-sm">Start your<br/>peaceful escape.</h1>
          <p className="text-stone-500 text-sm">Create an account to book your stay</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-1 shadow-sm border border-white/40">
            <Input 
              label=""
              icon={User}
              placeholder="Enter your name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="border-none bg-transparent"
              style={{ borderRadius: '1.5rem', height: '3.5rem' }}
            />
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-1 shadow-sm border border-white/40">
            <Input 
              label=""
              icon={Mail}
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="border-none bg-transparent"
              style={{ borderRadius: '1.5rem', height: '3.5rem' }}
            />
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-1 shadow-sm border border-white/40">
            <Input 
              label=""
              icon={Lock}
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="border-none bg-transparent"
              style={{ borderRadius: '1.5rem', height: '3.5rem' }}
            />
          </div>

          <div className="px-2">
             <label className="flex items-start gap-2 text-stone-600 cursor-pointer">
                <input type="checkbox" className="mt-1 rounded border-stone-300 text-earth-600 focus:ring-earth-500" />
                <span className="text-xs font-medium leading-relaxed">
                   I agree to the <span className="font-bold">Terms</span> and <span className="font-bold">Privacy Policy</span>.
                </span>
             </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl text-red-500 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <Button 
            fullWidth 
            size="lg" 
            className="rounded-full mt-2 h-14 text-base font-bold bg-earth-500 hover:bg-earth-600 text-white shadow-lg shadow-earth-500/30 border-none" 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Sign up'}
          </Button>
        </form>

        {/* Or Divider */}
        <div className="my-6 text-center relative">
          <p className="text-xs text-stone-400 font-medium bg-transparent relative z-10 px-2 inline-block">Or</p>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3 mb-8">
          <button className="w-full h-14 rounded-full bg-white/70 border border-earth-100 flex items-center justify-center gap-3 hover:bg-white transition-all shadow-sm">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            <span className="font-bold text-stone-700 text-sm">Google</span>
          </button>
          <button className="w-full h-14 rounded-full bg-white/70 border border-earth-100 flex items-center justify-center gap-3 hover:bg-white transition-all shadow-sm group">
            <svg className="w-5 h-5 text-stone-800" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.67 4.28-1.67 1.76 0 2.92.8 3.64 1.83-3.13 1.94-2.57 6.13.62 7.45-.63 1.63-1.48 3.19-2.92 4.61M12.03 5.38c.6-1.55 2.54-2.42 2.37-5.38-2.18.15-4.14 1.35-4.74 3.15-.65 1.8.18 3.79 2.37 2.23" />
            </svg>
            <span className="font-bold text-stone-700 text-sm">Apple</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto text-center pb-[calc(env(safe-area-inset-bottom,20px)+16px)]">
          <p className="text-stone-500 text-xs font-medium">
            Already have an account?{' '}
            <Link to="/signin" className="font-bold text-earth-600 hover:text-earth-700 transition-colors">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};