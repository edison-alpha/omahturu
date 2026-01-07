import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Copy, CreditCard, ShieldCheck, CheckCircle2, Wallet, QrCode, Building2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VILLAS } from '../constants';
import { getBookings, confirmPayment } from '../lib/storage';
import { Booking, Villa } from '../types';
import { Button } from '../components/ui/Button';

export const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking & { villa: Villa } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('qris');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadBooking = () => {
        const bookings = getBookings();
        const found = bookings.find(b => b.id === id);
        if (found) {
            const villa = VILLAS.find(v => v.id === found.villaId);
            if (villa) {
                setBooking({ ...found, villa });
                // Initialize expired state based on booking status
                if (found.status === 'expired') {
                    setIsExpired(true);
                    setTimeLeft('00:00:00');
                }
            }
        }
    };
    loadBooking();
  }, [id]);

  // Timer Logic
  useEffect(() => {
    if (!booking) return;

    // Check if already paid, cancelled, or expired to stop timer logic
    if (booking.status === 'paid' || booking.status === 'cancelled' || booking.status === 'expired') {
        return;
    }

    const calculateTimeLeft = () => {
        const now = Date.now();
        const diff = booking.paymentDeadline - now;

        if (diff <= 0) {
            setIsExpired(true);
            setTimeLeft('00:00:00');
            return true; // Stop interval
        } else {
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
            return false; // Continue interval
        }
    };

    // Run immediately to avoid 1s delay
    if (calculateTimeLeft()) return;

    const interval = setInterval(() => {
        if (calculateTimeLeft()) {
            clearInterval(interval);
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const handlePay = () => {
    if (isExpired) return;
    setIsProcessing(true);
    // Simulate network request
    setTimeout(() => {
        if (booking) {
            confirmPayment(booking.id);
            setIsProcessing(false);
            setShowSuccess(true);
        }
    }, 2000); 
  };

  const handleFinish = () => {
      navigate('/bookings', { replace: true });
  };

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-earth-50 pb-32 relative">
       {/* Header */}
       <div className="sticky top-0 z-30 bg-earth-50/90 backdrop-blur-md px-6 pt-12 pb-4 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-stone-800">Complete Payment</h1>
      </div>

      <div className="px-6 space-y-6">
        
        {/* Timer Card */}
        <div className="bg-stone-800 rounded-[2rem] p-6 text-white shadow-xl shadow-stone-800/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            {!isExpired ? (
                <>
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <Clock size={16} />
                        <span className="text-xs font-medium uppercase tracking-wider">Payment Deadline</span>
                    </div>
                    <div className="text-4xl font-mono font-bold tracking-tight mb-4">
                        {timeLeft || '--:--:--'}
                    </div>
                    <p className="text-sm text-stone-300 leading-relaxed">
                        Please complete your payment before the timer runs out to secure your booking at <span className="text-white font-bold">{booking.villa.name}</span>.
                    </p>
                </>
            ) : (
                <div className="flex flex-col items-center text-center py-2">
                    <AlertTriangle size={32} className="text-red-400 mb-2" />
                    <h3 className="text-xl font-bold text-red-400">Order Expired</h3>
                    <p className="text-sm text-stone-300 mt-2">
                        This booking has been automatically cancelled due to timeout.
                    </p>
                </div>
            )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone-100">
            <h3 className="font-bold text-stone-800 mb-4">Order Summary</h3>
            <div className="flex gap-4 mb-4 pb-4 border-b border-stone-50">
                <img src={booking.villa.images[0]} className="w-16 h-16 rounded-xl object-cover" alt="Villa" />
                <div>
                    <h4 className="font-bold text-stone-800 text-sm">{booking.villa.name}</h4>
                    <p className="text-xs text-stone-500 mb-1">{booking.villa.location}</p>
                    <p className="text-earth-600 font-bold text-sm">Rp {(booking.totalPrice / 1000).toFixed(0)}k</p>
                </div>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-stone-500 text-sm">Booking ID</span>
                <div className="flex items-center gap-2">
                    <span className="text-stone-800 font-mono text-sm">{booking.id}</span>
                    <Copy size={12} className="text-stone-400" />
                </div>
            </div>
        </div>

        {/* Payment Methods */}
        {!isExpired && (
            <div className="space-y-4">
                <h3 className="font-bold text-stone-800 px-1">Choose Payment Method</h3>
                
                {/* QRIS */}
                <button 
                    onClick={() => setSelectedMethod('qris')}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${selectedMethod === 'qris' ? 'bg-white border-earth-500 ring-1 ring-earth-500 shadow-md' : 'bg-white border-stone-100 opacity-80'}`}
                >
                    <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-600">
                        <QrCode size={20} />
                    </div>
                    <div className="flex-1 text-left">
                        <span className="block font-bold text-stone-800 text-sm">QRIS</span>
                        <span className="block text-stone-400 text-xs">Scan with any e-wallet app</span>
                    </div>
                    {selectedMethod === 'qris' && <div className="w-5 h-5 rounded-full bg-earth-500 flex items-center justify-center"><CheckCircle2 size={12} className="text-white"/></div>}
                </button>

                 {/* Virtual Account */}
                 <button 
                    onClick={() => setSelectedMethod('va')}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${selectedMethod === 'va' ? 'bg-white border-earth-500 ring-1 ring-earth-500 shadow-md' : 'bg-white border-stone-100 opacity-80'}`}
                >
                    <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-600">
                        <Building2 size={20} />
                    </div>
                    <div className="flex-1 text-left">
                        <span className="block font-bold text-stone-800 text-sm">Bank Transfer</span>
                        <span className="block text-stone-400 text-xs">BCA, Mandiri, BNI, BRI</span>
                    </div>
                    {selectedMethod === 'va' && <div className="w-5 h-5 rounded-full bg-earth-500 flex items-center justify-center"><CheckCircle2 size={12} className="text-white"/></div>}
                </button>

                 {/* E-Wallet */}
                 <button 
                    onClick={() => setSelectedMethod('wallet')}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${selectedMethod === 'wallet' ? 'bg-white border-earth-500 ring-1 ring-earth-500 shadow-md' : 'bg-white border-stone-100 opacity-80'}`}
                >
                    <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-600">
                        <Wallet size={20} />
                    </div>
                    <div className="flex-1 text-left">
                        <span className="block font-bold text-stone-800 text-sm">E-Wallet</span>
                        <span className="block text-stone-400 text-xs">GoPay, OVO, Dana</span>
                    </div>
                    {selectedMethod === 'wallet' && <div className="w-5 h-5 rounded-full bg-earth-500 flex items-center justify-center"><CheckCircle2 size={12} className="text-white"/></div>}
                </button>
            </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 p-6 pb-safe z-50">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
                <span className="text-xs text-stone-400 font-medium">Total Payment</span>
                <span className="text-xl font-bold text-earth-600">Rp {(booking.totalPrice / 1000).toFixed(0)}k</span>
            </div>
            {isExpired ? (
                <Button 
                    onClick={() => navigate('/home')}
                    className="bg-stone-200 text-stone-500 hover:bg-stone-300 shadow-none px-8 rounded-2xl"
                >
                    Find Other Villa
                </Button>
            ) : (
                <Button 
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="px-10 rounded-2xl flex items-center gap-2"
                >
                    {isProcessing ? 'Processing...' : 'Pay Now'}
                    {!isProcessing && <ShieldCheck size={18} />}
                </Button>
            )}
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl"
                >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-stone-800 mb-2">Payment Successful!</h2>
                    <p className="text-stone-500 text-sm mb-8 leading-relaxed">
                        We have received your payment. Your booking at <strong>{booking.villa.name}</strong> is now confirmed.
                    </p>
                    <Button fullWidth onClick={handleFinish} className="rounded-2xl">
                        View Booking Details
                    </Button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
