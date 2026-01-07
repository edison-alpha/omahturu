import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { VILLAS } from '../constants';
import { VillaCard } from '../components/VillaCard';
import { getWishlist } from '../lib/storage';
import { Villa } from '../types';

export const Wishlist = () => {
  const [wishlistVillas, setWishlistVillas] = useState<Villa[]>([]);

  useEffect(() => {
    const wishlistIds = getWishlist();
    const filtered = VILLAS.filter(v => wishlistIds.includes(v.id));
    setWishlistVillas(filtered);
  }, []);

  return (
    <div className="min-h-screen bg-earth-50 pb-32">
      <header className="px-6 pt-[calc(env(safe-area-inset-top,24px)+24px)] pb-6">
        <h1 className="text-2xl font-bold text-stone-800">My Wishlist</h1>
        <p className="text-stone-500 text-sm">Your favorite peaceful escapes.</p>
      </header>

      <div className="px-6">
        {wishlistVillas.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {wishlistVillas.map(villa => (
              <VillaCard key={villa.id} villa={villa} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-300 mb-4">
              <Heart size={32} />
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-2">Your wishlist is empty</h3>
            <p className="text-stone-500 text-sm max-w-[200px]">Start adding your favorite villas to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
};