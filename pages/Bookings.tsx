
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Moon, AlertTriangle, X, Star, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { VILLAS } from '../constants';
import { getBookings, cancelBooking } from '../lib/storage';
import { Booking, Villa } from '../types';
import { Button } from '../components/ui/Button';

export const Bookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<(Booking & { villa: Villa | undefined })[]>([]);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = () => {
    const stored = getBookings();
    const data = stored.map(b => ({
      ...b,
      villa: VILLAS.find(v => v.id === b.villaId)
    }));
    setBookings(data);
  };

  const calculateNights = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleConfirmCancel = () => {
    if (bookingToCancel) {
      cancelBooking(bookingToCancel);
      loadBookings();
      setBookingToCancel(null);
    }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'paid': return 'bg-green-100 text-green-700';
          case 'pending': return 'bg-yellow-100 text-yellow-700';
          case 'expired': return 'bg-red-100 text-red-700';
          case 'cancelled': return 'bg-stone-200 text-stone-500';
          default: return 'bg-stone-100 text-stone-500';
      }
  };

  return (
    <div className="min-h-screen bg-earth-50 pb-32 relative">
      <header className="px-6 pt-[calc(env(safe-area-inset-top,24px)+24px)] pb-6">
        <h1 className="text-2xl font-bold text-stone-800">My Bookings</h1>
        <p className="text-stone-500 text-sm">Upcoming and past stays.</p>
      </header>

      <div className="px-6 flex flex-col gap-4">
        {bookings.length > 0 ? (
          bookings.map(booking => {
            const nights = calculateNights(booking.checkIn, booking.checkOut);
            const canCancel = booking.status === 'paid' || booking.status === 'pending';

            return (
              <div 
                key={booking.id} 
                onClick={() => {
                    if (booking.status === 'pending') {
                        navigate(`/payment/${booking.id}`);
                    } else {
                        navigate(`/booking/${booking.id}`);
                    }
                }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
              >
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getStatusColor(booking.status)}`}>
                    {booking.status}
                </div>

                <div className="flex gap-4 mb-4">
                  <img 
                    src={booking.villa?.images[0]} 
                    className={`w-20 h-20 rounded-xl object-cover ${booking.status === 'expired' || booking.status === 'cancelled' ? 'grayscale opacity-60' : ''}`} 
                    alt={booking.villa?.name} 
                  />
                  <div className="flex-1 min-w-0 pr-16">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-stone-800 line-clamp-1">{booking.villa?.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 bg-earth-50 px-2 py-0.5 rounded-full w-fit mt-1">
                        <Moon size={10} className="text-earth-600" />
                        <span className="text-[10px] font-bold text-earth-600 whitespace-nowrap">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-400 mt-2 truncate">
                      <MapPin size={12} />
                      <span>{booking.villa?.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-50 flex justify-between items-center text-xs mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-stone-400 font-medium">CHECK-IN</span>
                    <span className="text-stone-800 font-bold">{formatDate(booking.checkIn)}</span>
                  </div>
                  <div className="h-6 w-px bg-stone-100"></div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-stone-400 font-medium">CHECK-OUT</span>
                    <span className="text-stone-800 font-bold">{formatDate(booking.checkOut)}</span>
                  </div>
                </div>
                
                {booking.status === 'pending' && (
                    <button className="w-full py-2.5 rounded-xl bg-earth-500 text-white text-xs font-bold hover:bg-earth-600 transition-colors flex items-center justify-center gap-2 mb-2">
                        Complete Payment
                        <Clock size={12} />
                    </button>
                )}

                {canCancel && (
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       setBookingToCancel(booking.id);
                     }}
                     className="w-full py-2.5 rounded-xl border border-red-100 bg-red-50/50 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                   >
                     Cancel Booking
                   </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-300 mb-4">
              <Calendar size={32} />
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-2">No bookings yet</h3>
            <p className="text-stone-500 text-sm max-w-[200px]">You haven't booked any villas. Explore our stays to get started!</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {bookingToCancel && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingToCancel(null)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl"
            >
               <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4 mx-auto">
                  <AlertTriangle size={24} />
               </div>
               <h3 className="text-xl font-bold text-stone-800 text-center mb-2">Cancel Booking?</h3>
               <p className="text-stone-500 text-sm text-center mb-8 leading-relaxed">
                 Are you sure you want to cancel this reservation? This action cannot be undone.
               </p>
               
               <div className="flex gap-3">
                 <Button 
                   variant="ghost" 
                   fullWidth 
                   onClick={() => setBookingToCancel(null)}
                   className="bg-stone-100 hover:bg-stone-200"
                 >
                   Keep it
                 </Button>
                 <Button 
                   fullWidth 
                   onClick={handleConfirmCancel}
                   className="bg-red-500 hover:bg-red-600 shadow-red-500/20"
                 >
                   Yes, Cancel
                 </Button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
