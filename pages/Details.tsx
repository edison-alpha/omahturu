
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, MapPin, Wifi, Wind, Coffee, Bath, X, CheckCircle2, Calendar as CalendarIcon, Moon, ChevronLeft, ChevronRight, Maximize2, Car, Wine, Briefcase, Sparkles, Clock, Shirt, Thermometer, Flame, Send, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { VILLAS } from '../constants';
import { Button } from '../components/ui/Button';
import { saveBooking, getBookings, getWishlist, toggleWishlist, getCurrentUser } from '../lib/storage';
import { Review } from '../types';

// Mock Reviews Data
const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    userName: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    date: '2024-01-15',
    content: 'Absolutely stunning views! The cabin was clean, cozy, and exactly as described. The morning mist over the mountains is magical.'
  },
  {
    id: '2',
    userName: 'David Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    rating: 4,
    date: '2023-12-28',
    content: 'Great experience overall. The staff was very helpful. Only downside was the wifi was a bit spotty, but it helped us disconnect!'
  },
  {
    id: '3',
    userName: 'Emily Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    date: '2023-11-12',
    content: 'Perfect getaway for our anniversary. The details in the design are incredible.'
  }
];

// Helper to format date as YYYY-MM-DD local time
const toDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper for display date (e.g., "May 10")
const toDisplayDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const Details = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const villa = VILLAS.find(v => v.id === id);
  const currentUser = getCurrentUser();
  
  // Carousel State
  const [imageIndex, setImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Wishlist State
  const [isLiked, setIsLiked] = useState(false);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Reviews State
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  // Date state
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(tomorrow.getDate() + 2);

  const [checkIn, setCheckIn] = useState(toDateString(tomorrow));
  const [checkOut, setCheckOut] = useState(toDateString(dayAfter));
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  
  // Calendar View State
  const [viewDate, setViewDate] = useState(new Date());

  // Initialize Data
  useEffect(() => {
    if (villa) {
      // Wishlist
      const wishlist = getWishlist();
      setIsLiked(wishlist.includes(villa.id));

      // Booked Dates (Simple logic: existing bookings + pending bookings block the calendar?)
      // For now, let's say 'pending' bookings also block dates to avoid double booking while paying
      // In a real app, you might hold it for 15 mins. Here we treat pending as booked.
      const villaBookings = getBookings().filter(b => b.villaId === villa.id && b.status !== 'cancelled' && b.status !== 'expired');
      const dates = new Set<string>();
      villaBookings.forEach(b => {
        let start = new Date(b.checkIn);
        let end = new Date(b.checkOut);
        
        let current = new Date(start);
        while (current < end) {
          dates.add(toDateString(current));
          current.setDate(current.getDate() + 1);
        }
      });
      setBookedDates(dates);
    }
  }, [villa]);

  const isBooked = (date: Date) => bookedDates.has(toDateString(date));

  // Range Availability Check
  const isRangeAvailable = useMemo(() => {
    if (!checkIn || !checkOut) return false;
    let start = new Date(checkIn);
    let end = new Date(checkOut);
    if (start >= end) return false;
    
    // Check every night in the range
    let current = new Date(start);
    while (current < end) {
        if (bookedDates.has(toDateString(current))) return false;
        current.setDate(current.getDate() + 1);
    }
    return true;
  }, [checkIn, checkOut, bookedDates]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [checkIn, checkOut]);

  if (!villa) return <div>Villa not found</div>;

  // Carousel Logic
  const changeImage = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < villa.images.length) {
      setDirection(newIndex > imageIndex ? 1 : -1);
      setImageIndex(newIndex);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const SWIPE_THRESHOLD = 50;
    if (info.offset.x < -SWIPE_THRESHOLD) {
      // Swipe Left -> Next
      if (imageIndex < villa.images.length - 1) {
        changeImage(imageIndex + 1);
      }
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      // Swipe Right -> Prev
      if (imageIndex > 0) {
        changeImage(imageIndex - 1);
      }
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0.8
    })
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wifi': return <Wifi size={20} />;
      case 'Wind': return <Wind size={20} />;
      case 'Coffee': return <Coffee size={20} />;
      case 'Bath': return <Bath size={20} />;
      case 'Car': return <Car size={20} />;
      case 'Wine': return <Wine size={20} />;
      case 'Briefcase': return <Briefcase size={20} />;
      case 'Sparkles': return <Sparkles size={20} />;
      case 'Clock': return <Clock size={20} />;
      case 'Shirt': return <Shirt size={20} />;
      case 'Heart': return <Heart size={20} />;
      case 'Thermometer': return <Thermometer size={20} />;
      case 'Flame': return <Flame size={20} />;
      default: return <Star size={20} />;
    }
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  const handleToggleLike = () => {
      const updated = toggleWishlist(villa.id);
      setIsLiked(updated.includes(villa.id));
  };

  const handleConfirmBooking = () => {
    if (nights === 0 || !isRangeAvailable) return;
    
    const newBooking = saveBooking({
      villaId: villa.id,
      checkIn,
      checkOut,
      totalPrice: villa.price * nights,
    });
    
    // Redirect to payment page immediately
    setIsBookingModalOpen(false);
    navigate(`/payment/${newBooking.id}`);
  };
  
  const handleSubmitReview = () => {
    if (!newReviewText.trim() || !currentUser) return;
    
    const newReview: Review = {
      id: Date.now().toString(),
      userName: currentUser.name || 'Anonymous',
      avatar: currentUser.avatar || 'https://i.pravatar.cc/150',
      rating: newReviewRating,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      content: newReviewText.trim()
    };
    
    setReviews([newReview, ...reviews]);
    setNewReviewText('');
    setNewReviewRating(5);
  };

  const closeModal = () => {
    setIsBookingModalOpen(false);
  };

  // Calendar Logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    
    const days = [];
    // Padding for empty days
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    return days;
  };

  const handleDateSelect = (date: Date) => {
      const dateStr = toDateString(date);
      
      // If nothing selected or both selected, start new selection
      if ((checkIn && checkOut) || (!checkIn && !checkOut)) {
          setCheckIn(dateStr);
          setCheckOut('');
      } else if (checkIn && !checkOut) {
          // Validate if before checkIn
          const start = new Date(checkIn);
          const end = new Date(dateStr);
          
          if (end < start) {
              setCheckIn(dateStr);
          } else {
              // Check if there are booked dates between start and end
              let hasOverlap = false;
              let current = new Date(start);
              while (current < end) {
                  if (bookedDates.has(toDateString(current))) {
                      hasOverlap = true;
                      break;
                  }
                  current.setDate(current.getDate() + 1);
              }

              if (hasOverlap) {
                  // If overlap, just reset start date to clicked date
                  setCheckIn(dateStr);
                  setCheckOut('');
              } else {
                  setCheckOut(dateStr);
              }
          }
      }
  };

  const isDateDisabled = (date: Date) => {
      const now = new Date();
      now.setHours(0,0,0,0);
      return date < now || isBooked(date);
  };

  const getDateStatus = (date: Date) => {
      const dateStr = toDateString(date);
      if (dateStr === checkIn) return 'start';
      if (dateStr === checkOut) return 'end';
      if (checkIn && checkOut && dateStr > checkIn && dateStr < checkOut) return 'range';
      return 'none';
  };

  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));

  return (
    <div className="bg-white min-h-screen relative">
      {/* Hero Image Section */}
      <div className="h-[45vh] relative w-full overflow-hidden bg-stone-100 group">
        <AnimatePresence initial={false} custom={direction}>
          <motion.img 
            key={imageIndex}
            src={villa.images[imageIndex]}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            onTap={() => setIsGalleryOpen(true)}
            alt={villa.name}
            className="absolute w-full h-full object-cover touch-pan-y cursor-zoom-in"
          />
        </AnimatePresence>
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent pointer-events-none z-10" />
        
        {/* Navigation Header */}
        <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center z-30 pointer-events-none">
          <button 
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors pointer-events-auto"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2 pointer-events-auto">
            <button 
                onClick={() => setIsGalleryOpen(true)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
            >
                <Maximize2 size={20} />
            </button>
            <button 
                onClick={handleToggleLike}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
            >
                <Heart 
                    size={20} 
                    fill={isLiked ? "currentColor" : "none"} 
                    className={isLiked ? "text-red-500" : "text-white"}
                />
            </button>
          </div>
        </div>

        {/* Thumbnail Gallery (Floating) */}
        <div className="absolute bottom-10 right-6 flex gap-2 z-20">
            {villa.images.map((img, idx) => (
                <button 
                    key={idx}
                    onClick={(e) => {
                        e.stopPropagation();
                        changeImage(idx);
                    }}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${imageIndex === idx ? 'border-earth-500 scale-110' : 'border-white/50 opacity-70'}`}
                >
                    <img src={img} className="w-full h-full object-cover" />
                </button>
            ))}
        </div>
      </div>

      {/* Content Sheet */}
      <div className="-mt-8 relative z-10 bg-white rounded-t-[2.5rem] px-6 pt-8 pb-32 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] min-h-[60vh]">
        {/* Title Block */}
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold text-stone-800 w-3/4 leading-tight">{villa.name}</h1>
          <div className="flex flex-col items-end">
             <span className="text-2xl font-bold text-earth-600">Rp {(villa.price / 1000).toFixed(0)}k</span>
             <span className="text-xs text-stone-400">/ malam</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-6">
          <MapPin size={16} className="flex-shrink-0" />
          <span className="line-clamp-2">{villa.location}</span>
        </div>
        
        {/* Rating Block moved here for better layout with long location */}
        <div className="flex items-center gap-1 mb-6">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-stone-800">{villa.rating}</span>
            <span className="text-stone-400">({villa.reviews} reviews)</span>
        </div>

        <hr className="border-stone-100 mb-6" />

        {/* Description */}
        <div className="mb-8">
            <h3 className="font-bold text-stone-800 mb-3 text-lg">About Destination</h3>
            <p className="text-stone-500 leading-relaxed text-sm">
                {isDescriptionExpanded ? villa.description : `${villa.description.slice(0, 150)}...`}
                <button 
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-earth-600 font-bold ml-1 hover:underline focus:outline-none"
                >
                  {isDescriptionExpanded ? 'Read less' : 'Read more'}
                </button>
            </p>
        </div>

        {/* Facilities */}
        <div className="mb-8">
            <h3 className="font-bold text-stone-800 mb-4 text-lg">Fasilitas</h3>
            <div className="grid grid-cols-2 gap-4">
                {villa.facilities.map((facility, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <div className="text-stone-400">
                             {getIcon(facility.icon)}
                        </div>
                        <span className="text-sm text-stone-600 font-medium">{facility.name}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Booking Rules */}
        {villa.bookingPolicy && (
          <div className="mb-8">
              <h3 className="font-bold text-stone-800 mb-4 text-lg uppercase tracking-wide text-sm">Aturan Pemesanan</h3>
              <div className="flex items-center gap-3 text-stone-600 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <Clock size={20} className="text-earth-500" />
                  <span className="text-sm font-medium">{villa.bookingPolicy}</span>
              </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mb-8 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-stone-800 text-lg">Reviews ({reviews.length})</h3>
            <div className="flex items-center gap-1">
               <Star size={16} className="fill-yellow-400 text-yellow-400" />
               <span className="font-bold text-stone-800">{villa.rating}</span>
            </div>
          </div>

          {/* Add Review Form */}
          <div className="bg-stone-50 rounded-2xl p-4 mb-6 border border-stone-100">
            <h4 className="font-bold text-stone-700 text-sm mb-3">Share your experience</h4>
            
            {/* Rating Input */}
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setNewReviewRating(star)}
                  className="transition-transform active:scale-95"
                >
                  <Star 
                    size={24} 
                    className={star <= newReviewRating ? "fill-yellow-400 text-yellow-400" : "text-stone-300"} 
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                placeholder="Write a review..."
                className="flex-1 bg-white rounded-xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-earth-500 focus:ring-1 focus:ring-earth-500"
              />
              <button 
                onClick={handleSubmitReview}
                disabled={!newReviewText.trim()}
                className="bg-earth-500 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-earth-600 transition-colors shadow-lg shadow-earth-500/20"
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Review List */}
          <div className="space-y-6">
             {reviews.map((review) => (
                <div key={review.id} className="flex gap-4">
                   <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden flex-shrink-0 border border-stone-100">
                      {review.avatar ? (
                        <img src={review.avatar} alt={review.userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                           <UserIcon size={20} />
                        </div>
                      )}
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                         <h5 className="font-bold text-stone-800 text-sm">{review.userName}</h5>
                         <span className="text-xs text-stone-400">{toDisplayDate(review.date)}</span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                         {[1, 2, 3, 4, 5].map((s) => (
                           <Star key={s} size={10} className={s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-stone-200"} />
                         ))}
                      </div>
                      <p className="text-stone-500 text-sm leading-relaxed">{review.content}</p>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Booking Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 p-6 pb-safe z-50">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
            <div className="flex flex-col">
                <span className="text-stone-400 text-xs font-medium uppercase tracking-wide">Stay for</span>
                <span className="text-xl font-bold text-stone-800">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
            </div>
            <Button size="lg" className="px-10 rounded-2xl shadow-earth-500/25" onClick={() => setIsBookingModalOpen(true)}>
                Book Now
            </Button>
        </div>
      </div>

      {/* Full Screen Gallery Modal */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            {/* Close Button */}
            <button 
                onClick={() => setIsGalleryOpen(false)}
                className="absolute top-6 right-6 z-50 p-2 bg-black/50 rounded-full text-white/80 hover:text-white backdrop-blur-md transition-colors"
            >
                <X size={24} />
            </button>

            {/* Counter */}
             <div className="absolute top-6 left-6 z-50 px-3 py-1 bg-black/50 rounded-full text-white text-sm backdrop-blur-md font-medium tracking-wide">
                {imageIndex + 1} / {villa.images.length}
            </div>

            {/* Main Gallery Image */}
            <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
                 <AnimatePresence initial={false} custom={direction}>
                  <motion.img 
                    key={imageIndex}
                    src={villa.images[imageIndex]}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={handleDragEnd}
                    className="absolute w-full h-full object-contain touch-pan-y"
                  />
                </AnimatePresence>
                
                {/* Navigation Arrows for Desktop/Ease */}
                <button 
                    onClick={(e) => { e.stopPropagation(); changeImage(imageIndex - 1); }}
                    disabled={imageIndex === 0}
                    className="absolute left-4 p-3 rounded-full bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 backdrop-blur-md transition-all hidden md:block"
                >
                    <ChevronLeft size={24} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); changeImage(imageIndex + 1); }}
                    disabled={imageIndex === villa.images.length - 1}
                    className="absolute right-4 p-3 rounded-full bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 backdrop-blur-md transition-all hidden md:block"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Bottom Thumbnails in Gallery */}
            <div className="absolute bottom-10 left-0 right-0 px-6 overflow-x-auto no-scrollbar flex justify-center gap-2 z-50">
                {villa.images.map((img, idx) => (
                    <button 
                        key={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            changeImage(idx);
                        }}
                        className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${imageIndex === idx ? 'border-earth-500 scale-110 ring-2 ring-black/50' : 'border-white/30 opacity-60'}`}
                    >
                        <img src={img} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white w-full max-w-md rounded-t-[3rem] p-6 pb-12 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-12 h-1.5 bg-stone-100 rounded-full mx-auto mb-6 sticky top-0"></div>
              
               <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-stone-800">Select Dates</h2>
                      <button onClick={closeModal} className="text-stone-400"><X size={24}/></button>
                    </div>

                    {/* Check-in / Check-out Display */}
                    <div className="flex gap-4 mb-4">
                      <div className={`flex-1 p-3 rounded-2xl border transition-colors ${!checkOut ? 'bg-earth-50 border-earth-200 ring-1 ring-earth-200' : 'bg-white border-stone-100'}`}>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Check-in</span>
                        <div className="flex items-center gap-2">
                           <CalendarIcon size={16} className="text-earth-500" />
                           <span className="font-bold text-stone-800 text-sm">{toDisplayDate(checkIn)}</span>
                        </div>
                      </div>
                      <div className={`flex-1 p-3 rounded-2xl border transition-colors ${checkIn && !checkOut ? 'bg-earth-50 border-earth-200 ring-1 ring-earth-200' : 'bg-white border-stone-100'}`}>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Check-out</span>
                         <div className="flex items-center gap-2">
                           <CalendarIcon size={16} className="text-earth-500" />
                           <span className="font-bold text-stone-800 text-sm">{toDisplayDate(checkOut) || 'Select Date'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Calendar Component (Compact Version) */}
                    <div className="bg-white rounded-2xl mb-4">
                       <div className="flex justify-between items-center mb-2 px-1">
                          <button onClick={prevMonth} className="p-1.5 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-800"><ChevronLeft size={18} /></button>
                          <span className="font-bold text-stone-800 text-sm">{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                          <button onClick={nextMonth} className="p-1.5 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-800"><ChevronRight size={18} /></button>
                       </div>
                       
                       <div className="grid grid-cols-7 mb-1">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                              <div key={d} className="text-center text-[10px] font-bold text-stone-300 py-1">{d}</div>
                          ))}
                       </div>

                       <div className="grid grid-cols-7 gap-y-1">
                          {getDaysInMonth(viewDate).map((date, i) => {
                              if (!date) return <div key={`empty-${i}`} />;
                              
                              const disabled = isDateDisabled(date);
                              const status = getDateStatus(date);
                              const isStart = status === 'start';
                              const isEnd = status === 'end';
                              const isRange = status === 'range';
                              
                              let textClass = "text-stone-700";
                              
                              if (disabled) {
                                  // Visually indicate unavailable dates
                                  textClass = "text-stone-300 line-through decoration-stone-300 cursor-not-allowed";
                              } else {
                                  if (isStart || isEnd) {
                                      textClass = "text-white";
                                  } else if (isRange) {
                                      textClass = "text-earth-800";
                                  }
                              }

                              return (
                                  <button
                                      key={i}
                                      onClick={() => !disabled && handleDateSelect(date)}
                                      disabled={disabled}
                                      className="h-8 w-full flex items-center justify-center text-xs font-medium transition-all relative"
                                  >
                                      {/* Connecting Strip */}
                                      {(isRange || (isStart && checkOut) || (isEnd && checkIn)) && (
                                          <div className={`absolute top-1 bottom-1 bg-earth-100
                                              ${isStart ? 'left-1/2 right-0' : ''}
                                              ${isEnd ? 'left-0 right-1/2' : ''}
                                              ${isRange ? 'left-0 right-0' : ''}
                                          `} />
                                      )}
                                      
                                      {/* Number Circle */}
                                      <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center ${isStart || isEnd ? 'bg-earth-600 shadow-md shadow-earth-500/30' : ''} ${textClass}`}>
                                          {date.getDate()}
                                      </div>
                                  </button>
                              );
                          })}
                       </div>
                    </div>

                    {/* Summary & Button */}
                    <div className="space-y-4">
                      {isRangeAvailable ? (
                        <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 flex justify-between items-center">
                            <div>
                                <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1 block">Total Price</span>
                                <div className="flex items-end gap-1">
                                    <span className="text-xl font-bold text-earth-600">Rp {((villa.price * (nights || 1)) / 1000).toFixed(0)}k</span>
                                    <span className="text-stone-400 text-xs mb-1">untuk {nights || 0} malam</span>
                                </div>
                            </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                            <AlertCircle className="text-red-500" size={24} />
                            <div>
                                <span className="text-red-500 text-xs font-bold uppercase tracking-wider mb-0.5 block">Dates Unavailable</span>
                                <span className="text-red-800 text-sm font-medium">Some selected dates are already booked.</span>
                            </div>
                        </div>
                      )}

                      <Button 
                        fullWidth 
                        size="lg" 
                        className="rounded-2xl" 
                        onClick={handleConfirmBooking}
                        disabled={!checkIn || !checkOut || nights <= 0 || !isRangeAvailable}
                      >
                        {isRangeAvailable ? 'Continue to Payment' : 'Dates Unavailable'}
                      </Button>
                    </div>
                  </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
