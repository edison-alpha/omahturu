import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ElementType;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  icon: Icon, 
  error, 
  type = 'text',
  className = '',
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`space-y-1 ${className.includes('bg-transparent') ? '' : 'space-y-2'}`}>
      {label && (
        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block ml-1">
          {label}
        </label>
      )}
      <div className={`
        relative flex items-center h-14 rounded-2xl transition-all duration-300
        ${className.includes('border-none') ? '' : 'bg-stone-50 border'}
        ${error 
          ? 'border-red-300 ring-1 ring-red-300' 
          : className.includes('border-none') ? '' : 'border-stone-100 focus-within:border-earth-500 focus-within:ring-1 focus-within:ring-earth-500'}
      `}>
        {Icon && (
          <div className="pl-4 text-stone-400">
            <Icon size={18} />
          </div>
        )}
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={`
            w-full h-full bg-transparent border-none outline-none font-medium text-stone-800 placeholder-stone-400 px-4
            ${Icon ? 'pl-3' : 'pl-4'}
            ${isPassword ? 'pr-12' : 'pr-4'}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-stone-400 hover:text-stone-600 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 font-medium ml-1 animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
};