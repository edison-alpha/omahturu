import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, X, LayoutGrid, Map as MapIcon, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VILLAS, CATEGORIES } from '../constants';
import { VillaCard } from '../components/VillaCard';
import { Villa } from '../types';
import { getCurrentUser, User } from '../lib/storage';

export const SeeAll = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  const initialCategory = (type === 'popular' || type === 'recommended') ? 'all' : (type || 'all');
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedVilla, setSelectedVilla] = useState<Villa | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Selamat Pagi';
    if (hour >= 12 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Load current user
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Filtering Logic
  const filteredVillas = VILLAS.filter(villa => {
    const matchesCategory = activeCategory === 'all' || villa.category === activeCategory;
    const matchesSearch = villa.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          villa.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Mock Map Markers logic
  const villaMarkers = filteredVillas.map((v, i) => ({
    ...v,
    top: `${20 + (i * 15) % 60}%`,
    left: `${15 + (i * 25) % 70}%`
  }));

  return (
    <div className="min-h-screen bg-earth-50 pb-32 relative flex flex-col">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-30 bg-earth-50/95 backdrop-blur-sm pt-12 pb-4 px-6 shadow-sm border-b border-stone-100/50">
        
        {/* Top Row */}
        <div className="flex justify-between items-center mb-6">
           <div className="flex flex-col">
            <div className="flex items-center gap-1 text-stone-500 text-sm mb-1">
              <MapPin size={14} />
              <span>Tawangmangu, Central Java</span>
            </div>
            <h2 className="text-xl font-bold text-stone-800 leading-none">
              {getGreeting()}, <span className="text-earth-600">{currentUser?.name?.split(' ')[0] || 'Traveler'}</span>
            </h2>
           </div>
           
           <div className="flex gap-2">
             <button 
                onClick={() => {
                    setViewMode(prev => prev === 'grid' ? 'map' : 'grid');
                    setSelectedVilla(null);
                }}
                className="p-2.5 bg-white rounded-full border border-stone-200 shadow-sm text-stone-600 hover:text-earth-500 transition-colors"
             >
               {viewMode === 'grid' ? <MapIcon size={20} /> : <LayoutGrid size={20} />}
             </button>
             <button className="p-2.5 bg-white rounded-full border border-stone-200 shadow-sm relative text-stone-600">
               <Bell size={20} />
               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
           </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 h-12 bg-white rounded-2xl flex items-center px-4 shadow-sm border border-stone-100">
            <Search size={20} className="text-stone-400 mr-3" />
            <input 
              type="text" 
              placeholder="Search room, cabin..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-stone-800 placeholder-stone-400"
            />
          </div>
          <button className="h-12 w-12 bg-stone-800 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-stone-800/20">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="-mx-6 overflow-x-auto no-scrollbar px-6">
            <div className="flex gap-3 items-center">
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
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
             <motion.div
                key="grid-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} 
                className="px-6 py-6 flex-1"
             >
                <div className="flex justify-between items-end mb-4">
                     <h3 className="text-xl font-bold text-stone-800">
                        {activeCategory === 'all' ? 'Our Accommodations' : `${CATEGORIES.find(c => c.id === activeCategory)?.name}`}
                     </h3>
                     <span className="text-xs text-stone-400 font-medium">{filteredVillas.length} results</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {filteredVillas.map(villa => (
                        <VillaCard key={villa.id} villa={villa} layout="portrait" />
                    ))}
                </div>

                {filteredVillas.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-20 text-center">
                       <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-300 mb-4">
                           <Search size={32} />
                       </div>
                       <p className="text-stone-400 font-medium">No units found.</p>
                       <button onClick={() => {setActiveCategory('all'); setSearchQuery('')}} className="text-earth-600 font-bold text-sm mt-2">Reset Filters</button>
                   </div>
               )}
             </motion.div>
        ) : (
            <motion.div 
                key="map-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 relative bg-stone-200 w-full h-[calc(100vh-280px)]"
            >
                {/* Mock Map Background */}
                <div 
                  className="absolute inset-0 opacity-80"
                  style={{
                    backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/111.1294,-7.6622,14,0/800x1200?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTAwMHQycXA2dnJueFpndmoifQ')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />

                {/* Map Markers */}
                {villaMarkers.map((villa) => (
                  <motion.button
                    key={`marker-${villa.id}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setSelectedVilla(villa)}
                    className={`absolute z-20 transition-transform ${selectedVilla?.id === villa.id ? 'scale-125' : 'hover:scale-110'}`}
                    style={{ top: villa.top, left: villa.left }}
                  >
                    <div className={`
                        px-3 py-1.5 rounded-full shadow-xl font-bold text-sm flex items-center gap-1.5 border-2
                        ${selectedVilla?.id === villa.id 
                            ? 'bg-stone-800 text-white border-white' 
                            : 'bg-white text-stone-800 border-earth-100'}
                    `}>
                      <span className="text-xs text-earth-500">Rp</span>
                      {(villa.price / 1000).toFixed(0)}k
                    </div>
                     <div className={`
                        w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] mx-auto -mt-[1px]
                        ${selectedVilla?.id === villa.id ? 'border-t-stone-800' : 'border-t-white'}
                    `} />
                  </motion.button>
                ))}

                 {/* Selected Villa Detail Overlay */}
                <AnimatePresence>
                  {selectedVilla && (
                    <motion.div 
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      className="absolute bottom-6 left-6 right-6 z-40"
                    >
                      <div className="relative">
                        <button 
                          onClick={() => setSelectedVilla(null)}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center z-50 text-stone-400 hover:text-stone-800 border border-stone-100"
                        >
                          <X size={16} />
                        </button>
                        <VillaCard villa={selectedVilla} layout="landscape" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
