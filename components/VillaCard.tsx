import React, { useState, useEffect } from 'react';
import { Star, Heart, Users, Bed, Bath, Utensils } from 'lucide-react';
import { Villa } from '../types';
import { useNavigate } from 'react-router-dom';
import { getWishlist, toggleWishlist } from '../lib/storage';

interface VillaCardProps {
  villa: Villa;
  layout?: 'portrait' | 'landscape';
}

export const VillaCard: React.FC<VillaCardProps> = ({ villa, layout = 'portrait' }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const wishlist = getWishlist();
    setIsLiked(wishlist.includes(villa.id));
  }, [villa.id]);

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleWishlist(villa.id);
    setIsLiked(updated.includes(villa.id));
  };

  if (layout === 'landscape') {
    return (
      <div 
        onClick={() => navigate(`/villa/${villa.id}`)}
        className="flex gap-3 p-3 bg-white rounded-2xl shadow-sm border border-stone-100 active:scale-95 transition-transform"
      >
        <div className="relative w-20 h-20 flex-shrink-0">
          <img 
            src={villa.images[0]} 
            alt={villa.name} 
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-stone-800 text-sm truncate pr-2">{villa.name}</h3>
            <button 
              onClick={handleToggleLike}
              className={`transition-colors ${isLiked ? 'text-red-500' : 'text-stone-300'}`}
            >
              <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
            </button>
          </div>
          <p className="text-[10px] text-stone-400 mb-1 truncate">{villa.location}</p>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1 text-[10px] font-bold text-stone-700">
              <Star size={10} className="fill-yellow-400 text-yellow-400" />
              {villa.rating}
            </div>
            <p className="text-earth-600 font-bold text-xs">Rp {(villa.price / 1000).toFixed(0)}k<span className="text-[8px] text-stone-400 font-normal">/malam</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => navigate(`/villa/${villa.id}`)}
      className="relative bg-transparent active:scale-[0.97] transition-all group cursor-pointer mb-2"
    >
      {/* Background Image Container - Adjusted aspect ratio to be more "kotak" (4:4.2 instead of 3.2:4) */}
      <div className="relative aspect-[1/1.1] overflow-hidden rounded-[2.2rem] shadow-sm">
        <img 
          src={villa.images[0]} 
          alt={villa.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Wishlist Button - Top Right */}
        <button 
          onClick={handleToggleLike}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/15 backdrop-blur-md flex items-center justify-center transition-all hover:bg-white/20"
        >
          <Heart 
            size={18} 
            className={isLiked ? 'text-red-500' : 'text-white'} 
            fill={isLiked ? "currentColor" : "none"} 
            strokeWidth={2.5}
          />
        </button>
      </div>

      {/* Floating Price Tag - Positioned at the seam, adjusted bottom offset for new aspect ratio */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[104px] z-20">
        <div className="bg-white px-4 py-1.5 rounded-xl shadow-lg border border-earth-100 flex items-center gap-0.5 whitespace-nowrap">
          <span className="text-stone-800 font-bold text-sm">Rp {(villa.price / 1000).toFixed(0)}k</span>
          <span className="text-stone-400 text-[10px] font-medium">/malam</span>
        </div>
      </div>
      
      {/* Content Sheet - Compact overlay */}
      <div className="bg-white rounded-[2.2rem] px-4 pt-8 pb-4 -mt-14 relative z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100/40 text-center">
        <h3 className="font-bold text-sm text-stone-800 mb-1 truncate px-1">{villa.name}</h3>
        
        {/* Meta Info Row */}
        <div className="flex items-center justify-center gap-1.5 text-stone-400 mb-3 px-1">
          <div className="flex items-center gap-0.5">
            <Users size={12} className="text-stone-300" />
            <span className="text-[10px] font-medium">{villa.guests || 4}</span>
          </div>
          <span className="text-stone-200 text-[8px]">•</span>
          <div className="flex items-center gap-0.5">
            <Bed size={12} className="text-stone-300" />
            <span className="text-[10px] font-medium">{villa.bedrooms || 2}</span>
          </div>
          <span className="text-stone-200 text-[8px]">•</span>
          <div className="flex items-center gap-0.5">
            <Bath size={12} className="text-stone-300" />
            <span className="text-[10px] font-medium">{villa.bathrooms || 2}</span>
          </div>
          <span className="text-stone-200 text-[8px]">•</span>
          <div className="flex items-center gap-0.5">
            <Utensils size={12} className="text-stone-300" />
            <span className="text-[10px] font-medium">1</span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between border-t border-stone-50 pt-3 px-0.5">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-tight">Jan 10-15</span>
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-stone-800 text-stone-800" />
            <span className="text-[11px] font-bold text-stone-800">{villa.rating}</span>
            <span className="text-[9px] text-stone-300 font-medium">({villa.reviews})</span>
          </div>
        </div>
      </div>
    </div>
  );
};