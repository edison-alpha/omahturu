
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Search, MapPin, SlidersHorizontal, Bell, LayoutGrid, Map as MapIcon, X, Star, Sparkles, Wifi, Coffee, Car, Bath, Thermometer, Flame, Calendar, Clock, ChevronRight, Navigation, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, VILLAS } from '../constants';
import { VillaCard } from '../components/VillaCard';
import { Villa, Booking } from '../types';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { getBookings } from '../lib/storage';

// Lazy load Map component
const Map = lazy(() => import('../components/Map').then(module => ({ default: module.Map })));

type ViewMode = 'grid' | 'map';
type PriceFilter = 'any' | 'low' | 'mid' | 'high';

// Omah Turu coordinates (Gondosuli, Tawangmangu)
const OMAH_TURU_COORDS = { lat: -7.6667, lng: 111.1333 };

interface UserLocation {
  lat: number;
  lng: number;
}

interface NotificationItem {
  id: string;
  type: 'promo' | 'booking' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  isFeatured?: boolean;
  actionLabel?: string;
  villaId?: string; // For linking
}

export const Home = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedVilla, setSelectedVilla] = useState<Villa | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // User Location State
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [userLocationName, setUserLocationName] = useState<string>('Mendeteksi lokasi...');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distanceToOmahTuru, setDistanceToOmahTuru] = useState<number | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('any');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Route Planning State
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('Omah Turu, Tawangmangu');
  const [startSuggestions, setStartSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [endSuggestions, setEndSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [activeInput, setActiveInput] = useState<'start' | 'end' | null>(null);
  const [startLocation, setStartLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [endLocation, setEndLocation] = useState<{ lat: number; lng: number; name: string } | null>({ 
    lat: OMAH_TURU_COORDS.lat, 
    lng: OMAH_TURU_COORDS.lng, 
    name: 'Omah Turu' 
  });
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Route State
  const [routeInfo, setRouteInfo] = useState<{ duration: number; distance: number } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Set user location as start when detected and name is ready
  useEffect(() => {
    if (userLocation && !startLocation && userLocationName && userLocationName !== 'Mendeteksi lokasi...') {
      setStartLocation({ lat: userLocation.lat, lng: userLocation.lng, name: userLocationName });
      setStartQuery(userLocationName);
    }
  }, [userLocation, userLocationName, startLocation]);

  // Fetch suggestions for start location
  useEffect(() => {
    if (!startQuery || startQuery.trim().length < 2 || activeInput !== 'start') {
      setStartSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startQuery)}&limit=5&countrycodes=id`,
          { headers: { 'Accept-Language': 'id' } }
        );
        const data = await response.json();
        setStartSuggestions(data || []);
      } catch (error) {
        console.error('Search failed:', error);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [startQuery, activeInput]);

  // Fetch suggestions for end location
  useEffect(() => {
    if (activeInput !== 'end') {
      setEndSuggestions([]);
      return;
    }
    
    if (!endQuery || endQuery.trim().length < 2) {
      setEndSuggestions([]);
      return;
    }

    let isCancelled = false;
    
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endQuery)}&limit=5&countrycodes=id`,
          { headers: { 'Accept-Language': 'id' } }
        );
        const data = await response.json();
        if (!isCancelled) {
          setEndSuggestions(data || []);
        }
      } catch (error) {
        console.error('Search failed:', error);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => {
      isCancelled = true;
      clearTimeout(debounce);
    };
  }, [endQuery, activeInput]);

  const handleSelectStart = (suggestion: { display_name: string; lat: string; lon: string }) => {
    const name = suggestion.display_name.split(',')[0];
    setStartQuery(name);
    setStartLocation({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon), name });
    setStartSuggestions([]);
    setActiveInput(null);
  };

  const handleSelectEnd = (suggestion: { display_name: string; lat: string; lon: string }) => {
    const name = suggestion.display_name.split(',')[0];
    setEndQuery(name);
    setEndLocation({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon), name });
    setEndSuggestions([]);
    setActiveInput(null);
  };

  const useMyLocation = () => {
    if (userLocation) {
      setStartLocation({ lat: userLocation.lat, lng: userLocation.lng, name: userLocationName });
      setStartQuery(userLocationName);
      setStartSuggestions([]);
      setActiveInput(null);
    } else {
      getUserLocation();
    }
  };

  // Fetch route info
  useEffect(() => {
    if (!startLocation || !endLocation || viewMode !== 'map') {
      setRouteInfo(null);
      return;
    }

    async function fetchRoute() {
      setIsLoadingRoute(true);
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${endLocation.lng},${endLocation.lat}?overview=false`
        );
        const data = await response.json();
        if (data.routes?.[0]) {
          setRouteInfo({
            duration: data.routes[0].duration,
            distance: data.routes[0].distance
          });
        }
      } catch (error) {
        console.error('Failed to fetch route:', error);
      } finally {
        setIsLoadingRoute(false);
      }
    }

    fetchRoute();
  }, [startLocation, endLocation, viewMode]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get user location with better mobile support
  const getUserLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung browser Anda');
      setUserLocationName('Lokasi tidak tersedia');
      setLocationLoading(false);
      return;
    }

    // Check if we're on HTTPS (required for geolocation on mobile)
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      console.warn('Geolocation requires HTTPS on mobile devices');
      setLocationError('Fitur lokasi memerlukan koneksi HTTPS');
      setUserLocationName('HTTPS diperlukan');
      setLocationLoading(false);
      return;
    }

    // Try to check permission status (not supported on all browsers, especially Safari iOS)
    let permissionState: 'prompt' | 'granted' | 'denied' | 'unknown' = 'unknown';
    
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        permissionState = permissionStatus.state as 'prompt' | 'granted' | 'denied';
        console.log('Geolocation permission:', permissionState);
        
        if (permissionState === 'denied') {
          setLocationError('Izin lokasi ditolak');
          setUserLocationName('Tap untuk izinkan lokasi');
          setLocationLoading(false);
          setLocationPermission('denied');
          // Don't use alert - show in UI instead
          return;
        }
      } catch (e) {
        // Permissions API not supported (Safari iOS, older browsers)
        // Continue anyway - will get error from getCurrentPosition if denied
        console.log('Permissions API not supported, proceeding with location request');
      }
    }

    // Request location with options optimized for mobile
    // Use lower accuracy first for faster response, then high accuracy
    const options: PositionOptions = {
      enableHighAccuracy: false, // Start with low accuracy for faster response
      timeout: 10000, // 10 seconds for low accuracy
      maximumAge: 300000 // Cache for 5 minutes
    };

    const highAccuracyOptions: PositionOptions = {
      enableHighAccuracy: true, // Use GPS on mobile
      timeout: 30000, // 30 seconds for high accuracy (GPS can be slow)
      maximumAge: 60000 // Cache for 1 minute
    };

    // Helper function to process location
    const processLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log('Location obtained:', { latitude, longitude, accuracy });
      
      setUserLocation({ lat: latitude, lng: longitude });
      setLocationPermission('granted');
      
      // Calculate distance to Omah Turu
      const distance = calculateDistance(latitude, longitude, OMAH_TURU_COORDS.lat, OMAH_TURU_COORDS.lng);
      setDistanceToOmahTuru(distance);
      
      // Reverse geocoding using Nominatim (OpenStreetMap)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'id' } }
        );
        const data = await response.json();
        
        if (data.address) {
          const { village, suburb, neighbourhood, city_district, city, town, county, municipality, state_district, state } = data.address;
          
          // Prioritas: desa/kelurahan -> kecamatan -> kota/kabupaten
          const desa = village || suburb || neighbourhood || '';
          const kecamatan = city_district || town || municipality || '';
          const kota = city || county || state_district || '';
          const provinsi = state || '';
          
          const locationParts = [];
          if (desa) locationParts.push(desa);
          if (kecamatan && kecamatan !== desa) locationParts.push(kecamatan);
          if (!desa && !kecamatan && kota) locationParts.push(kota);
          if (locationParts.length === 0 && provinsi) locationParts.push(provinsi);
          
          setUserLocationName(locationParts.slice(0, 2).join(', ') || 'Indonesia');
        } else {
          setUserLocationName('Indonesia');
        }
      } catch (err) {
        setUserLocationName('Indonesia');
      }
      
      setLocationLoading(false);
    };

    // Helper function to handle errors
    const handleLocationError = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error.code, error.message);
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          setLocationError('Izin lokasi ditolak');
          setUserLocationName('Tap untuk izinkan');
          setLocationPermission('denied');
          // Show custom prompt instead of alert
          setShowLocationPrompt(true);
          break;
        case error.POSITION_UNAVAILABLE:
          setLocationError('Lokasi tidak tersedia');
          setUserLocationName('GPS tidak aktif');
          break;
        case error.TIMEOUT:
          setLocationError('Timeout - coba lagi');
          setUserLocationName('Tap untuk coba lagi');
          break;
        default:
          setLocationError('Gagal mendapatkan lokasi');
          setUserLocationName('Tap untuk coba lagi');
      }
      setLocationLoading(false);
    };

    // First try with low accuracy for quick response
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Got low accuracy position, use it immediately
        await processLocation(position);
        
        // Then try to get high accuracy in background (optional improvement)
        if (position.coords.accuracy > 100) {
          navigator.geolocation.getCurrentPosition(
            processLocation,
            () => {}, // Ignore errors for high accuracy retry
            highAccuracyOptions
          );
        }
      },
      (error) => {
        // Low accuracy failed, try high accuracy as fallback
        if (error.code === error.TIMEOUT) {
          console.log('Low accuracy timeout, trying high accuracy...');
          navigator.geolocation.getCurrentPosition(
            processLocation,
            handleLocationError,
            highAccuracyOptions
          );
        } else {
          handleLocationError(error);
        }
      },
      options
    );
  };

  // Check location permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      // Check if we've already asked (stored in localStorage)
      const hasAsked = localStorage.getItem('locationPermissionAsked');
      
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          setLocationPermission(permissionStatus.state as 'prompt' | 'granted' | 'denied');
          
          if (permissionStatus.state === 'granted') {
            // Already granted, get location
            getUserLocation();
          } else if (permissionStatus.state === 'prompt' && !hasAsked) {
            // Show our custom prompt
            setShowLocationPrompt(true);
          } else if (permissionStatus.state === 'denied') {
            setUserLocationName('Izin lokasi ditolak');
          }
          
          // Listen for permission changes
          permissionStatus.onchange = () => {
            setLocationPermission(permissionStatus.state as 'prompt' | 'granted' | 'denied');
            if (permissionStatus.state === 'granted') {
              getUserLocation();
            }
          };
        } catch (e) {
          // Permissions API not supported, show prompt if not asked before
          if (!hasAsked) {
            setShowLocationPrompt(true);
          }
        }
      } else {
        // No permissions API, show prompt if not asked before
        if (!hasAsked) {
          setShowLocationPrompt(true);
        }
      }
    };
    
    checkPermission();
  }, []);

  const handleAllowLocation = () => {
    localStorage.setItem('locationPermissionAsked', 'true');
    setShowLocationPrompt(false);
    getUserLocation();
  };

  const handleDenyLocation = () => {
    localStorage.setItem('locationPermissionAsked', 'true');
    setShowLocationPrompt(false);
    setUserLocationName('Lokasi tidak diizinkan');
    setLocationPermission('denied');
  };

  // Load Notifications & Check Reminders
  useEffect(() => {
    generateNotifications();
  }, []);

  const generateNotifications = () => {
    const bookings = getBookings();
    const systemNotifs: NotificationItem[] = [];

    // 1. Check for Upcoming Bookings (Simulation of Push/Email Reminder)
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    bookings.forEach(booking => {
        if (booking.status === 'paid' || booking.status === 'pending') {
            const checkInDate = new Date(booking.checkIn);
            const villa = VILLAS.find(v => v.id === booking.villaId);
            
            // If check-in is in the future but within 3 days
            if (checkInDate >= now && checkInDate <= threeDaysFromNow) {
                const diffTime = Math.abs(checkInDate.getTime() - now.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                let title = "Upcoming Trip Reminder";
                let msg = `Your stay at ${villa?.name} is coming up in ${diffDays} day${diffDays > 1 ? 's' : ''}!`;
                
                if (diffDays === 0 || diffDays === 1) {
                    title = "Check-in Tomorrow!";
                    msg = `Pack your bags! Your stay at ${villa?.name} starts tomorrow.`;
                }

                if (booking.status === 'pending') {
                    title = "Payment Reminder";
                    msg = `Please complete payment for ${villa?.name} to secure your booking.`;
                }

                systemNotifs.push({
                    id: `booking-${booking.id}`,
                    type: 'booking',
                    title: title,
                    message: msg,
                    time: 'Just now',
                    read: false,
                    villaId: booking.id // Link to booking detail
                });
            }
        }
    });

    // 2. Add Marketing / Default Notifs
    const marketingNotifs: NotificationItem[] = [
        {
            id: 'promo-1',
            type: 'promo',
            title: 'Tawangmangu Weekend Sale! 🌿',
            message: 'Get 20% off on all Glamping units this weekend.',
            time: '2h ago',
            read: false,
            isFeatured: true,
            actionLabel: 'Claim Offer'
        },
        {
            id: 'sys-1',
            type: 'system',
            title: 'Welcome to Omah Turu',
            message: 'Find your perfect sanctuary in the Tawangmangu forest.',
            time: '1d ago',
            read: true
        }
    ];

    // Combine: Reminders first, then marketing
    setNotifications([...systemNotifs, ...marketingNotifs]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif: NotificationItem) => {
      // Mark as read logic could go here
      if (notif.type === 'booking' && notif.villaId) {
          // If pending, go to payment, else booking detail
          const booking = getBookings().find(b => b.id === notif.villaId);
          if (booking?.status === 'pending') {
             navigate(`/payment/${notif.villaId}`);
          } else {
             navigate(`/booking/${notif.villaId}`);
          }
      }
      setIsNotificationsOpen(false);
  };

  // Filter Logic
  const filteredVillas = VILLAS.filter(v => {
    // 1. Category Filter
    if (activeCategory !== 'all' && v.category !== activeCategory) return false;

    // 2. Price Filter
    // Low: < 1.2jt, Mid: 1.2jt - 2.25jt, High: > 2.25jt
    if (priceFilter === 'low' && v.price >= 1200000) return false;
    if (priceFilter === 'mid' && (v.price < 1200000 || v.price > 2250000)) return false;
    if (priceFilter === 'high' && v.price <= 2250000) return false;

    // 3. Amenity Filter (Must have ALL selected)
    if (selectedAmenities.length > 0) {
      const villaIcons = v.facilities.map(f => f.icon);
      const hasAll = selectedAmenities.every(icon => villaIcons.includes(icon));
      if (!hasAll) return false;
    }

    // 4. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = v.name.toLowerCase().includes(query);
      const matchesLocation = v.location.toLowerCase().includes(query);
      if (!matchesName && !matchesLocation) return false;
    }

    return true;
  });

  const handleResetFilters = () => {
    setPriceFilter('any');
    setSelectedAmenities([]);
    setSearchQuery('');
  };

  const toggleAmenity = (icon: string) => {
    setSelectedAmenities(prev => 
      prev.includes(icon) ? prev.filter(i => i !== icon) : [...prev, icon]
    );
  };

  // Mock coordinates for map (relative to a container)
  const villaMarkers = filteredVillas.map((v, i) => ({
    ...v,
    top: `${20 + (i * 15) % 60}%`,
    left: `${15 + (i * 25) % 70}%`
  }));

  const handleToggleView = () => {
    setViewMode(prev => prev === 'grid' ? 'map' : 'grid');
    setSelectedVilla(null);
  };

  const amenityOptions = [
    { icon: Wifi, label: 'Wifi', id: 'Wifi' },
    { icon: Coffee, label: 'Breakfast', id: 'Coffee' },
    { icon: Car, label: 'Parking', id: 'Car' },
    { icon: Bath, label: 'Bath', id: 'Bath' },
    { icon: Thermometer, label: 'Heater', id: 'Thermometer' },
    { icon: Flame, label: 'Bonfire', id: 'Flame' },
  ];

  return (
    <div className="min-h-screen bg-earth-50 pb-32 flex flex-col relative">
      {/* Header - Different for Grid vs Map */}
      {viewMode === 'grid' ? (
        <header className="px-6 pt-12 pb-4 sticky top-0 z-30 bg-earth-50/95 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <button 
                onClick={getUserLocation}
                className="flex items-center gap-1 text-stone-500 text-sm mb-1 hover:text-earth-600 transition-colors"
              >
                <MapPin size={14} className={locationLoading ? 'animate-pulse' : ''} />
                <span>{userLocationName}</span>
                {locationLoading && <Loader2 size={12} className="animate-spin ml-1" />}
              </button>
              <h2 className="text-2xl font-bold text-stone-800">
                Good Morning, <span className="text-earth-600">Alex</span>
              </h2>
            </div>
            <div className="flex gap-2">
               <button 
                  onClick={handleToggleView}
                  className="p-2.5 bg-white rounded-full border border-stone-200 shadow-sm text-stone-600 hover:text-earth-500 transition-colors"
                  title="Switch to Map"
               >
                 <MapIcon size={20} />
               </button>
               <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2.5 bg-white rounded-full border border-stone-200 shadow-sm relative text-stone-600 hover:bg-stone-50 transition-colors"
               >
                 <Bell size={20} />
                 {unreadCount > 0 && (
                   <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                 )}
               </button>
            </div>
          </div>

          {/* Search Bar for Villas */}
          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-white rounded-2xl flex items-center px-4 shadow-sm border border-stone-100">
              <Search size={20} className="text-stone-400 mr-3" />
              <input 
                type="text" 
                placeholder="Search room or cabin..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-stone-800 placeholder-stone-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-600">
                  <X size={16} />
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="h-12 w-12 bg-stone-800 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-stone-800/20 active:scale-95 transition-transform"
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </header>
      ) : (
        <header className="px-4 pt-10 pb-4 fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-stone-900/80 via-stone-900/50 to-transparent">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white">
              Route <span className="text-earth-300">Planner</span>
            </h2>
            <button 
              onClick={handleToggleView}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-stone-600 hover:text-earth-500 transition-colors"
              title="Switch to Grid"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          {/* Route Input Fields - Google Maps Style */}
          <div className="flex items-stretch gap-2">
            {/* Left Side - Icons & Line */}
            <div className="flex flex-col items-center py-3 pl-2">
              {/* Start Circle */}
              <div className="w-4 h-4 rounded-full border-2 border-teal-500 bg-white flex-shrink-0" />
              {/* Dotted Line */}
              <div className="flex-1 w-0.5 my-1 border-l-2 border-dotted border-stone-300" />
              {/* End Pin */}
              <svg width="16" height="20" viewBox="0 0 24 24" fill="#ef4444" className="flex-shrink-0">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>

            {/* Input Fields */}
            <div className="flex-1 flex flex-col gap-2 py-2 pr-2">
              {/* Start Location Input */}
              <div className="relative">
                <div className={`flex items-center bg-white rounded-xl border-2 transition-colors ${activeInput === 'start' ? 'border-teal-500' : 'border-stone-200'}`}>
                  <input 
                    type="text" 
                    placeholder="Pilih titik awal, atau klik peta..." 
                    value={startQuery}
                    onChange={(e) => setStartQuery(e.target.value)}
                    onFocus={() => setActiveInput('start')}
                    className="flex-1 bg-transparent border-none outline-none text-stone-800 placeholder-stone-400 text-sm px-4 py-3"
                  />
                  {startQuery ? (
                    <button onClick={() => { setStartQuery(''); setStartLocation(null); }} className="pr-3 text-stone-400 hover:text-stone-600">
                      <X size={18} />
                    </button>
                  ) : (
                    <button onClick={useMyLocation} className="pr-3 text-stone-400 hover:text-teal-500">
                      {locationLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </button>
                  )}
                </div>
                
                {/* Start Suggestions */}
                {activeInput === 'start' && startSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-stone-100 z-50 max-h-48 overflow-y-auto">
                    {startSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectStart(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-stone-50 flex items-center gap-3 border-b border-stone-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                          <MapPin size={16} className="text-stone-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800 truncate">{suggestion.display_name.split(',')[0]}</p>
                          <p className="text-xs text-stone-400 truncate">{suggestion.display_name.split(',').slice(1, 3).join(',')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* End Location Input */}
              <div className="relative">
                <div className={`flex items-center bg-white rounded-xl border-2 transition-colors ${activeInput === 'end' ? 'border-red-400' : 'border-stone-200'}`}>
                  <input 
                    type="text" 
                    placeholder="Pilih tujuan..." 
                    value={endQuery}
                    onChange={(e) => setEndQuery(e.target.value)}
                    onFocus={() => setActiveInput('end')}
                    className="flex-1 bg-transparent border-none outline-none text-stone-800 placeholder-stone-400 text-sm px-4 py-3"
                  />
                  {endQuery && (
                    <button onClick={() => { setEndQuery(''); setEndLocation(null); }} className="pr-3 text-stone-400 hover:text-stone-600">
                      <X size={18} />
                    </button>
                  )}
                </div>
                
                {/* End Suggestions */}
                {activeInput === 'end' && endSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-stone-100 z-50 max-h-48 overflow-y-auto">
                    {endSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectEnd(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-stone-50 flex items-center gap-3 border-b border-stone-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                          <MapPin size={16} className="text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800 truncate">{suggestion.display_name.split(',')[0]}</p>
                          <p className="text-xs text-stone-400 truncate">{suggestion.display_name.split(',').slice(1, 3).join(',')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex items-center pr-2">
              <button 
                onClick={() => {
                  // Swap start and end
                  const tempQuery = startQuery;
                  const tempLocation = startLocation;
                  setStartQuery(endQuery);
                  setStartLocation(endLocation);
                  setEndQuery(tempQuery);
                  setEndLocation(tempLocation);
                }}
                className="w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-700 transition-colors shadow-sm"
                title="Tukar lokasi"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Route Info - Compact */}
          {startLocation && endLocation && routeInfo && activeInput === null && (
            <div className="mt-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md flex items-center gap-3 w-fit">
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-earth-500" />
                <span className="font-bold text-stone-800 text-xs">{formatDuration(routeInfo.duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Navigation size={12} className="text-stone-400" />
                <span className="font-medium text-stone-500 text-xs">{formatDistance(routeInfo.distance)}</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-green-500 text-white">
                Fastest
              </span>
            </div>
          )}

          {/* Loading Route */}
          {isLoadingRoute && (
            <div className="mt-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md flex items-center gap-2 w-fit">
              <Loader2 size={12} className="animate-spin text-earth-500" />
              <span className="text-xs text-stone-600">Menghitung rute...</span>
            </div>
          )}
        </header>
      )}

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsNotificationsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-24 right-6 w-80 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-stone-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-stone-50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                  <h3 className="font-bold text-stone-800">Notifications</h3>
                  {unreadCount > 0 && (
                      <button className="text-xs text-earth-600 font-bold hover:text-earth-700">Mark all read</button>
                  )}
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto">
                  {notifications.map((notif) => {
                      if (notif.isFeatured) {
                          return (
                            <div key={notif.id} className="p-4 bg-gradient-to-br from-earth-50 to-white border-b border-stone-50">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-earth-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-earth-500/30">
                                        <Sparkles size={18} fill="currentColor" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-stone-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">FEATURED</span>
                                            <span className="text-[10px] text-stone-400 font-medium">{notif.time}</span>
                                        </div>
                                        <h4 className="font-bold text-stone-800 text-sm mb-1">{notif.title}</h4>
                                        <p className="text-stone-500 text-xs leading-relaxed mb-2">
                                            {notif.message}
                                        </p>
                                        {notif.actionLabel && (
                                            <button className="text-xs font-bold text-earth-600 hover:text-earth-700 flex items-center gap-1">
                                                {notif.actionLabel} <ChevronRight size={12}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                          );
                      }

                      return (
                        <div 
                            key={notif.id} 
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 hover:bg-stone-50 transition-colors cursor-pointer border-b border-stone-50/50 ${!notif.read ? 'bg-stone-50/30' : ''}`}
                        >
                            <div className="flex gap-3">
                                <div className={`
                                    mt-1.5 w-2 h-2 rounded-full flex-shrink-0 
                                    ${notif.type === 'booking' ? 'bg-earth-500 ring-4 ring-earth-50' : 'bg-stone-200'}
                                    ${!notif.read && notif.type === 'booking' ? 'animate-pulse' : ''}
                                `}></div>
                                <div>
                                    <h4 className="font-bold text-stone-800 text-sm mb-0.5 flex items-center gap-2">
                                        {notif.title}
                                        {notif.type === 'booking' && <Calendar size={12} className="text-stone-400" />}
                                    </h4>
                                    <p className="text-stone-500 text-xs leading-relaxed">{notif.message}</p>
                                    <span className="text-[10px] text-stone-300 mt-1 block font-medium">{notif.time}</span>
                                </div>
                            </div>
                        </div>
                      );
                  })}
                  
                  {notifications.length === 0 && (
                      <div className="p-8 text-center text-stone-400 text-sm">
                          No notifications yet.
                      </div>
                  )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div 
            key="grid-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1"
          >
            {/* Categories */}
            <div className="pl-6 mb-8 mt-4 overflow-x-auto no-scrollbar">
              <div className="flex gap-3 pr-6 items-center">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`
                      h-10 px-5 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300
                      ${activeCategory === cat.id 
                        ? 'bg-earth-500 text-white shadow-md shadow-earth-500/25' 
                        : 'bg-white text-stone-500 border border-stone-100'}
                    `}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Section */}
            <div className="px-6">
              <div className="flex justify-between items-end mb-5">
                <h3 className="text-xl font-bold text-stone-800">
                  {activeCategory === 'all' ? 'Our Rooms' : `${CATEGORIES.find(c => c.id === activeCategory)?.name}`}
                </h3>
                <button 
                  onClick={() => navigate(`/see-all/${activeCategory === 'all' ? 'popular' : activeCategory}`)}
                  className="text-earth-600 text-sm font-medium hover:text-earth-700 transition-colors"
                >
                  See All
                </button>
              </div>

              {filteredVillas.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {filteredVillas.map((villa) => (
                    <VillaCard key={villa.id} villa={villa} />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mx-auto mb-3">
                    <Search size={24} />
                  </div>
                  <p className="text-stone-500 font-medium">No results found.</p>
                  <button onClick={handleResetFilters} className="text-earth-600 text-sm font-bold mt-2 hover:underline">Clear Filters</button>
                </div>
              )}
            </div>

            {/* Recommended Section (Only show if not filtering or if it makes sense contextually) */}
            {activeCategory === 'all' && priceFilter === 'any' && selectedAmenities.length === 0 && (
                <div className="mt-8 px-6 mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-xl font-bold text-stone-800">Recommended for You</h3>
                    <button 
                        onClick={() => navigate('/see-all/recommended')}
                        className="text-earth-600 text-sm font-medium hover:text-earth-700 transition-colors"
                    >
                        See All
                    </button>
                </div>
                <div className="flex flex-col gap-4">
                    {VILLAS.slice().reverse().map((villa) => (
                    <VillaCard key={`rec-${villa.id}`} villa={villa} layout="landscape" />
                    ))}
                </div>
                </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="map-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-200"
          >
            {/* Interactive Map */}
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
                <Loader2 size={32} className="animate-spin text-earth-500" />
              </div>
            }>
              <Map
                zoom={14}
                startLocation={startLocation}
                endLocation={endLocation}
                selectedLocation={selectedLocation}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Permission Modal */}
      <AnimatePresence>
        {showLocationPrompt && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handleDenyLocation}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed left-3 right-3 bottom-6 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-w-sm mx-auto"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-earth-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} className="text-earth-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-800">Izinkan Akses Lokasi</h3>
                    <p className="text-xs text-stone-500">Untuk navigasi & rekomendasi terdekat</p>
                  </div>
                </div>
                
                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleDenyLocation}
                    className="flex-1 py-2.5 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors text-sm"
                  >
                    Nanti
                  </button>
                  <button
                    onClick={handleAllowLocation}
                    className="flex-1 py-2.5 bg-earth-500 hover:bg-earth-600 text-white font-semibold rounded-xl transition-colors text-sm"
                  >
                    Izinkan
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2.5rem] p-6 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
                <div className="w-12 h-1.5 bg-stone-100 rounded-full mx-auto mb-6"></div>
                
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-xl font-bold text-stone-800">Filters</h2>
                   <button 
                     onClick={handleResetFilters}
                     className="text-sm font-bold text-stone-400 hover:text-earth-600 transition-colors"
                   >
                     Reset
                   </button>
                </div>

                {/* Price Range */}
                <div className="mb-8">
                   <h3 className="font-bold text-stone-800 mb-4 text-sm">Price Range</h3>
                   <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      {[
                        { id: 'any', label: 'Semua harga' },
                        { id: 'low', label: '< Rp 1.2jt' },
                        { id: 'mid', label: 'Rp 1.2jt - 2.25jt' },
                        { id: 'high', label: '> Rp 2.25jt' }
                      ].map((price) => (
                         <button
                           key={price.id}
                           onClick={() => setPriceFilter(price.id as PriceFilter)}
                           className={`
                             px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-all
                             ${priceFilter === price.id 
                               ? 'bg-stone-800 text-white border-stone-800' 
                               : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}
                           `}
                         >
                            {price.label}
                         </button>
                      ))}
                   </div>
                </div>

                {/* Amenities */}
                <div className="mb-8">
                    <h3 className="font-bold text-stone-800 mb-4 text-sm">Amenities</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {amenityOptions.map((item) => {
                            const isSelected = selectedAmenities.includes(item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => toggleAmenity(item.id)}
                                    className={`
                                      flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all aspect-square
                                      ${isSelected 
                                        ? 'bg-earth-50 border-earth-500 text-earth-700 ring-1 ring-earth-500' 
                                        : 'bg-white border-stone-100 text-stone-400 hover:bg-stone-50'}
                                    `}
                                >
                                    <item.icon size={24} strokeWidth={isSelected ? 2 : 1.5} />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Action Button */}
                <Button 
                   fullWidth 
                   size="lg" 
                   onClick={() => setIsFilterOpen(false)}
                   className="rounded-2xl"
                >
                    Show {filteredVillas.length} Results
                </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
