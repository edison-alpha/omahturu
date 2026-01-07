import React, { useEffect, useState } from 'react';
import { 
  Map as MapComponent, 
  MapMarker, 
  MarkerContent, 
  MarkerLabel,
  MapRoute,
  useMap
} from './ui/map';
import { Plus, Minus, Locate, Compass, Layers, Navigation, Loader2 } from 'lucide-react';

interface MapProps {
  zoom?: number;
  startLocation?: { lat: number; lng: number; name: string } | null;
  endLocation?: { lat: number; lng: number; name: string } | null;
  selectedLocation?: { lat: number; lng: number } | null;
}

interface RouteData {
  coordinates: [number, number][];
  duration: number;
  distance: number;
}

const isValidCoord = (lat: number | undefined, lng: number | undefined): boolean => {
  if (lat === undefined || lng === undefined) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (!isFinite(lat) || !isFinite(lng)) return false;
  return true;
};

function MapNavigator({ 
  startLocation, 
  endLocation,
  selectedLocation,
  routeCoords
}: { 
  startLocation: { lat: number; lng: number } | null;
  endLocation: { lat: number; lng: number } | null;
  selectedLocation: { lat: number; lng: number } | null;
  routeCoords: [number, number][];
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (selectedLocation && isValidCoord(selectedLocation.lat, selectedLocation.lng)) {
      map.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 15,
        duration: 1000
      });
    }
  }, [map, isLoaded, selectedLocation]);

  useEffect(() => {
    if (!map || !isLoaded || selectedLocation) return;
    
    // If we have route coordinates, fit to route
    if (routeCoords.length > 0) {
      const lngs = routeCoords.map(c => c[0]);
      const lats = routeCoords.map(c => c[1]);
      
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: { top: 180, bottom: 150, left: 50, right: 50 }, maxZoom: 13 }
      );
    } else if (startLocation && endLocation) {
      // Fit to start and end locations
      const lngs = [startLocation.lng, endLocation.lng];
      const lats = [startLocation.lat, endLocation.lat];
      
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: { top: 180, bottom: 150, left: 50, right: 50 }, maxZoom: 13 }
      );
    }
  }, [map, isLoaded, routeCoords, selectedLocation, startLocation, endLocation]);

  return null;
}

// Default center (Indonesia)
const DEFAULT_CENTER = { lat: -7.6667, lng: 111.1333 };

// Custom Map Controls Component
function CustomMapControls() {
  const { map, isLoaded } = useMap();
  const [isLocating, setIsLocating] = useState(false);
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard');
  const [is3D, setIs3D] = useState(false);

  const handleZoomIn = () => {
    map?.zoomTo(map.getZoom() + 1, { duration: 300 });
  };

  const handleZoomOut = () => {
    map?.zoomTo(map.getZoom() - 1, { duration: 300 });
  };

  const handleLocate = async () => {
    if (!("geolocation" in navigator)) {
      console.warn('Geolocation tidak didukung browser');
      return;
    }

    // Check HTTPS requirement
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      console.warn('Geolocation requires HTTPS');
      return;
    }

    setIsLocating(true);

    // Try to check permission (not supported on Safari iOS)
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (permissionStatus.state === 'denied') {
          console.warn('Location permission denied');
          setIsLocating(false);
          return;
        }
      } catch (e) {
        // Permissions API not supported, continue anyway
      }
    }

    // Start with low accuracy for faster response
    const lowAccuracyOptions: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000
    };

    const highAccuracyOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000
    };

    const flyToLocation = (pos: GeolocationPosition) => {
      map?.flyTo({
        center: [pos.coords.longitude, pos.coords.latitude],
        zoom: 15,
        duration: 1500,
      });
      setIsLocating(false);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        flyToLocation(pos);
        // Try high accuracy in background if needed
        if (pos.coords.accuracy > 100) {
          navigator.geolocation.getCurrentPosition(
            flyToLocation,
            () => {}, // Ignore errors for retry
            highAccuracyOptions
          );
        }
      },
      (error) => {
        console.error("Geolocation error:", error.code, error.message);
        // Try high accuracy as fallback on timeout
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            flyToLocation,
            () => setIsLocating(false),
            highAccuracyOptions
          );
        } else {
          setIsLocating(false);
        }
      },
      lowAccuracyOptions
    );
  };

  const handleResetNorth = () => {
    map?.resetNorthPitch({ duration: 300 });
  };

  const handleToggle3D = () => {
    if (!map) return;
    const newPitch = is3D ? 0 : 60;
    map.easeTo({ pitch: newPitch, duration: 300 });
    setIs3D(!is3D);
  };

  const handleToggleStyle = () => {
    if (!map) return;
    const newStyle = mapStyle === 'standard' ? 'satellite' : 'standard';
    
    const styles = {
      standard: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      satellite: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '© Esri'
          }
        },
        layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }]
      }
    };
    
    map.setStyle(styles[newStyle] as maplibregl.StyleSpecification);
    setMapStyle(newStyle);
  };

  if (!isLoaded) return null;

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
      {/* Main Control Container - Glass Effect */}
      <div className="bg-white/40 backdrop-blur-xl rounded-full shadow-lg py-2 px-1 flex flex-col items-center gap-1 border border-white/50">
        {/* Layer Switcher */}
        <button
          onClick={handleToggleStyle}
          className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors overflow-hidden border-2 border-white shadow"
          title={mapStyle === 'standard' ? 'Satellite View' : 'Standard View'}
        >
          {mapStyle === 'standard' ? (
            <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
              <Layers size={18} className="text-white" />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-500 flex items-center justify-center">
              <Layers size={18} className="text-white" />
            </div>
          )}
        </button>

        {/* Divider */}
        <div className="w-6 h-px bg-stone-200 my-1" />

        {/* Locate Button */}
        <button
          onClick={handleLocate}
          disabled={isLocating}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors disabled:opacity-50"
          title="My Location"
        >
          {isLocating ? (
            <Loader2 size={20} className="text-stone-600 animate-spin" />
          ) : (
            <Locate size={20} className="text-stone-600" />
          )}
        </button>

        {/* Divider */}
        <div className="w-6 h-px bg-stone-200 my-1" />

        {/* Zoom Controls */}
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors"
          title="Zoom In"
        >
          <Plus size={22} className="text-stone-600" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors"
          title="Zoom Out"
        >
          <Minus size={22} className="text-stone-600" />
        </button>

        {/* Divider */}
        <div className="w-6 h-px bg-stone-200 my-1" />

        {/* Compass / Reset North */}
        <button
          onClick={handleResetNorth}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors"
          title="Reset North"
        >
          <Navigation size={20} className="text-red-500" fill="#ef4444" style={{ transform: 'rotate(-45deg)' }} />
        </button>

        {/* 3D Toggle */}
        <button
          onClick={handleToggle3D}
          className={`w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors ${is3D ? 'bg-stone-100' : ''}`}
          title={is3D ? 'Disable 3D' : 'Enable 3D'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-600">
            <path d="M12 3L2 9l10 6 10-6-10-6z" />
            <path d="M2 15l10 6 10-6" />
            <path d="M2 9v6" />
            <path d="M22 9v6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export const Map: React.FC<MapProps> = ({
  zoom = 14,
  startLocation,
  endLocation,
  selectedLocation
}) => {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const validStartLocation = startLocation && isValidCoord(startLocation.lat, startLocation.lng);
  const validEndLocation = endLocation && isValidCoord(endLocation.lat, endLocation.lng);
  const validSelectedLocation = selectedLocation && isValidCoord(selectedLocation.lat, selectedLocation.lng);

  // Fetch route when both start and end locations are valid
  useEffect(() => {
    if (!validStartLocation || !validEndLocation) {
      setRoutes([]);
      return;
    }

    async function fetchRoutes() {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startLocation!.lng},${startLocation!.lat};${endLocation!.lng},${endLocation!.lat}?overview=full&geometries=geojson&alternatives=true`
        );
        const data = await response.json();
        
        if (data.routes?.length > 0) {
          const routeData: RouteData[] = data.routes.map((route: {
            geometry: { coordinates: [number, number][] };
            duration: number;
            distance: number;
          }) => ({
            coordinates: route.geometry.coordinates,
            duration: route.duration,
            distance: route.distance
          }));
          setRoutes(routeData);
          setSelectedRouteIndex(0);
        }
      } catch (error) {
        console.error('Failed to fetch routes:', error);
      }
    }

    fetchRoutes();
  }, [validStartLocation, validEndLocation, startLocation, endLocation]);

  // Determine map center
  const mapCenter = validEndLocation 
    ? [endLocation!.lng, endLocation!.lat] as [number, number]
    : validStartLocation 
      ? [startLocation!.lng, startLocation!.lat] as [number, number]
      : [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat] as [number, number];

  // Sort routes: non-selected first, selected last (renders on top)
  const sortedRoutes = routes.map((route, index) => ({ route, index }))
    .sort((a: { route: RouteData; index: number }, b: { route: RouteData; index: number }) => {
      if (a.index === selectedRouteIndex) return 1;
      if (b.index === selectedRouteIndex) return -1;
      return 0;
    });

  return (
    <div className="absolute inset-0">
      <MapComponent 
        center={mapCenter} 
        zoom={zoom}
      >
        <CustomMapControls />
        
        <MapNavigator 
          startLocation={startLocation || null} 
          endLocation={endLocation || null}
          selectedLocation={selectedLocation || null}
          routeCoords={routes[selectedRouteIndex]?.coordinates || []}
        />

        {/* Route Lines */}
        {sortedRoutes.map(({ route, index }: { route: RouteData; index: number }) => {
          const isSelected = index === selectedRouteIndex;
          return (
            <React.Fragment key={`route-${index}`}>
              <MapRoute 
                coordinates={route.coordinates} 
                color={isSelected ? "#c07a5e" : "#94a3b8"}
                width={isSelected ? 6 : 4} 
                opacity={isSelected ? 1 : 0.5}
                onClick={() => setSelectedRouteIndex(index)}
              />
            </React.Fragment>
          );
        })}

        {/* Start Location Marker (User) - Pin Style with Profile Photo */}
        {validStartLocation && (
          <MapMarker longitude={startLocation!.lng} latitude={startLocation!.lat}>
            <MarkerContent>
              <div className="relative flex flex-col items-center">
                {/* Info Label */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-1 shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs font-semibold text-stone-700">Lokasi Anda</span>
                </div>
                
                {/* Pin Container */}
                <div className="relative">
                  {/* Pin Body with Profile Photo */}
                  <div className="w-14 h-14 rounded-full bg-white shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" 
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Pin Pointer */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-l-transparent border-r-transparent border-t-white drop-shadow-md" />
                  {/* Online Indicator */}
                  <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>
                
                {/* Pulse Animation */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-blue-400/30 animate-ping" />
              </div>
            </MarkerContent>
          </MapMarker>
        )}

        {/* End Location Marker (Destination) - Pin Style with Icon */}
        {validEndLocation && (
          <MapMarker longitude={endLocation!.lng} latitude={endLocation!.lat}>
            <MarkerContent>
              <div className="relative flex flex-col items-center">
                {/* Info Label with Duration */}
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 whitespace-nowrap">
                  <div className="w-5 h-5 rounded-full border-2 border-stone-300 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-500">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-stone-800">{endLocation!.name}</span>
                </div>
                
                {/* Pin Container */}
                <div className="relative">
                  {/* Pin Body */}
                  <div className="w-16 h-16 rounded-full bg-white shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
                    {/* Destination Icon - House/Villa */}
                    <div className="w-full h-full bg-gradient-to-br from-earth-400 to-earth-600 flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                      </svg>
                    </div>
                  </div>
                  {/* Pin Pointer */}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[14px] border-l-transparent border-r-transparent border-t-white drop-shadow-md" />
                </div>
                
                {/* Shadow */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm" />
              </div>
            </MarkerContent>
          </MapMarker>
        )}

        {/* Selected Location Marker (Search Result) */}
        {validSelectedLocation && (
          <MapMarker longitude={selectedLocation!.lng} latitude={selectedLocation!.lat}>
            <MarkerContent>
              <div className="relative flex flex-col items-center">
                {/* Label */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-1 shadow-lg whitespace-nowrap">
                  <span className="text-xs font-semibold text-stone-700">Hasil Pencarian</span>
                </div>
                
                {/* Pin */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-l-transparent border-r-transparent border-t-white drop-shadow-md" />
                </div>
              </div>
            </MarkerContent>
          </MapMarker>
        )}
      </MapComponent>
    </div>
  );
};

export default Map;
