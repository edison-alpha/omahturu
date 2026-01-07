
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, CreditCard, User, Star, Copy, Phone, MessageSquare, AlertTriangle, CheckCircle2, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VILLAS } from '../constants';
import { getBookings, cancelBooking } from '../lib/storage';
import { Booking, Villa } from '../types';
import { Button } from '../components/ui/Button';

export const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking & { villa: Villa } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    const allBookings = getBookings();
    const foundBooking = allBookings.find(b => b.id === id);
    
    if (foundBooking) {
      const villa = VILLAS.find(v => v.id === foundBooking.villaId);
      if (villa) {
        setBooking({ ...foundBooking, villa });
      }
    }
  }, [id]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-earth-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
           <div className="w-12 h-12 bg-stone-200 rounded-full mb-4"></div>
           <div className="h-4 w-32 bg-stone-200 rounded"></div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const calculateNights = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/bookings');
    }
  };

  const handleCancel = () => {
    cancelBooking(booking.id);
    navigate('/bookings');
  };

  const handleGetDirections = () => {
    if (booking.villa.coordinates) {
      const { lat, lng } = booking.villa.coordinates;
      // Open OpenStreetMap with directions
      window.open(`https://www.openstreetmap.org/directions?from=&to=${lat},${lng}&route=car#map=15/${lat}/${lng}`, '_blank');
    } else {
      // Fallback: search by location name
      const query = encodeURIComponent(booking.villa.location);
      window.open(`https://www.openstreetmap.org/search?query=${query}`, '_blank');
    }
  };

  const getStatusBadge = () => {
      switch(booking.status) {
          case 'paid': 
            return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">CONFIRMED</span>;
          case 'pending':
            return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">PENDING</span>;
          case 'expired':
            return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">EXPIRED</span>;
          case 'cancelled':
            return <span className="bg-stone-200 text-stone-500 text-[10px] font-bold px-2 py-0.5 rounded-full">CANCELLED</span>;
      }
  };

  return (
    <div className="min-h-screen bg-earth-50 pb-24 relative">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-earth-50/90 backdrop-blur-md px-6 pt-12 pb-4 flex items-center gap-4">
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-stone-800">Booking Details</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Villa Summary Card */}
        <div 
            onClick={() => navigate(`/villa/${booking.villa.id}`)}
            className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-stone-100 flex gap-4 items-center active:scale-[0.98] transition-transform cursor-pointer"
        >
          <img 
            src={booking.villa.images[0]} 
            alt={booking.villa.name} 
            className={`w-20 h-20 rounded-2xl object-cover ${booking.status === 'expired' ? 'grayscale opacity-60' : ''}`}
          />
          <div className="flex-1 min-w-0">
             <div className="flex justify-between items-start mb-1">
                <h2 className="font-bold text-stone-800 truncate pr-2">{booking.villa.name}</h2>
                {getStatusBadge()}
             </div>
             <div className="flex items-center gap-1 text-xs text-stone-500 mb-2">
                <MapPin size={12} />
                <span className="truncate">{booking.villa.location}</span>
             </div>
             <div className="flex items-center gap-1">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-stone-800">{booking.villa.rating}</span>
             </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
            <h3 className="font-bold text-stone-800 mb-6 flex items-center gap-2">
                <Calendar size={18} className="text-earth-500" />
                Trip Schedule
            </h3>
            
            <div className="relative pl-4 border-l-2 border-dashed border-stone-100 space-y-8">
                <motion.div 
                   initial={{ opacity: 0, x: -15 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.2 }}
                   className="relative"
                >
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-earth-500 ring-4 ring-white shadow-sm"></div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Check-in</p>
                    <p className="text-stone-800 font-bold text-lg">{formatDate(booking.checkIn)}</p>
                    <p className="text-stone-500 text-sm">After 02:00 PM</p>
                </motion.div>
                <motion.div 
                   initial={{ opacity: 0, x: -15 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.4 }}
                   className="relative"
                >
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-stone-300 ring-4 ring-white shadow-sm"></div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Check-out</p>
                    <p className="text-stone-800 font-bold text-lg">{formatDate(booking.checkOut)}</p>
                    <p className="text-stone-500 text-sm">Before 11:00 AM</p>
                </motion.div>
            </div>
        </div>

        {/* Booking Info Grid */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-stone-100">
                <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 mb-3">
                    <User size={16} />
                </div>
                <p className="text-xs text-stone-400 font-medium mb-1">Guests</p>
                <p className="text-stone-800 font-bold">{booking.villa.guests || 2} Adults</p>
            </div>
            <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-stone-100">
                 <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 mb-3">
                    <Clock size={16} />
                </div>
                <p className="text-xs text-stone-400 font-medium mb-1">Duration</p>
                <p className="text-stone-800 font-bold">{calculateNights(booking.checkIn, booking.checkOut)} Nights</p>
            </div>
        </div>

        {/* Payment Detail */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-stone-800 flex items-center gap-2">
                    <CreditCard size={18} className="text-earth-500" />
                    Payment Details
                </h3>
            </div>
            <div className="space-y-3 border-b border-stone-50 pb-4 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-stone-500">{calculateNights(booking.checkIn, booking.checkOut)} Malam x Rp {(booking.villa.price / 1000).toFixed(0)}k</span>
                    <span className="text-stone-800 font-medium">Rp {(booking.totalPrice / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Service Fee</span>
                    <span className="text-stone-800 font-medium">Rp 0</span>
                </div>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-stone-800 font-bold">Total</span>
                <span className="text-xl font-bold text-earth-600">Rp {(booking.totalPrice / 1000).toFixed(0)}k</span>
            </div>
        </div>

        {/* Host & Actions */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
             <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full bg-stone-200 overflow-hidden">
                         <img src="https://i.pravatar.cc/150?u=host" alt="Host" className="w-full h-full object-cover" />
                     </div>
                     <div>
                         <p className="text-xs text-stone-400 font-medium">Hosted by</p>
                         <p className="font-bold text-stone-800">Wayan</p>
                     </div>
                 </div>
                 <div className="flex gap-2">
                     <button className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors">
                         <MessageSquare size={18} />
                     </button>
                     <button className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors">
                         <Phone size={18} />
                     </button>
                 </div>
             </div>
             
             <div className="flex flex-col gap-3">
                 <Button 
                   variant="outline" 
                   fullWidth 
                   className="gap-2 rounded-xl h-12"
                   onClick={handleGetDirections}
                 >
                     <Map size={18} />
                     Get Directions
                 </Button>
                 
                 {booking.status === 'pending' && (
                     <Button 
                        onClick={() => navigate(`/payment/${booking.id}`)}
                        fullWidth 
                        className="rounded-xl h-12"
                     >
                        Pay Now
                     </Button>
                 )}

                 {(booking.status === 'paid' || booking.status === 'pending') && (
                     <button 
                       onClick={() => setShowCancelModal(true)}
                       className="w-full h-12 flex items-center justify-center gap-2 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-colors"
                     >
                        Cancel Booking
                     </button>
                 )}
             </div>
        </div>

        <div className="flex justify-center pb-8">
            <div className="flex items-center gap-2 text-stone-400 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm">
                <span className="text-xs font-mono">ID: {booking.id}</span>
                <button className="hover:text-stone-800"><Copy size={12} /></button>
            </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelModal(false)}
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
                 Are you sure you want to cancel your stay at <strong>{booking.villa.name}</strong>? This action cannot be undone.
               </p>
               
               <div className="flex gap-3">
                 <Button 
                   variant="ghost" 
                   fullWidth 
                   onClick={() => setShowCancelModal(false)}
                   className="bg-stone-100 hover:bg-stone-200"
                 >
                   Keep it
                 </Button>
                 <Button 
                   fullWidth 
                   onClick={handleCancel}
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
