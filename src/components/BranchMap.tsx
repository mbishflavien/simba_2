import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, X, Navigation, Locate, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import L from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Branch {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  distance?: number;
}

export const SIMBA_BRANCHES: Branch[] = [
  { id: 'town-center', name: 'Simba Town Center', lat: -1.9441, lng: 30.0619, address: 'KN 82 St, Kigali City Center' },
  { id: 'kigali-heights', name: 'Simba Kigali Heights', lat: -1.9540, lng: 30.0935, address: 'Kigali Heights Mall, KG 7 Ave' },
  { id: 'kimironko', name: 'Simba Kimironko', lat: -1.9545, lng: 30.1264, address: 'Near Kimironko Market' },
  { id: 'gacuriro', name: 'Simba Gacuriro', lat: -1.9197, lng: 30.0927, address: 'Vision City Area, Gacuriro' },
  { id: 'kicukiro', name: 'Simba Kicukiro', lat: -1.9774, lng: 30.0995, address: 'Kicukiro Center' },
  { id: 'nyamirambo', name: 'Simba Nyamirambo', lat: -1.9688, lng: 30.0521, address: 'KN 2 Ave, Nyamirambo' },
  { id: 'remera', name: 'Simba Remera', lat: -1.9602, lng: 30.1065, address: 'RSSB Building, Remera' },
];

const DEFAULT_CENTER: [number, number] = [-1.9441, 30.0619];

// Distance helper (Haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface BranchMapProps {
  onSelectBranch: (branch: Branch) => void;
  selectedBranch?: string;
  userLocation?: { lat: number; lng: number } | null;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function BranchMap({ onSelectBranch, selectedBranch, userLocation }: BranchMapProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [internalUserPos, setInternalUserPos] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(13);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isRouting, setIsRouting] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

  const fetchRoute = async (start: [number, number], end: [number, number], id: string) => {
    setActiveRouteId(id);
    setIsRouting(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        setRouteCoords(coords);
        
        // Auto zoom to fit route
        if (coords.length > 0) {
           // We'll let the map auto center if needed, but the ChangeView handles basic centering
        }
      }
    } catch (err) {
      console.error("Routing error:", err);
      setLocationError("Could not calculate route. Please try again later.");
    } finally {
      setIsRouting(false);
    }
  };

  const clearRoute = () => {
    setRouteCoords([]);
    setActiveRouteId(null);
  };

  // Computed user position (prop override takes precedence)
  const effectiveUserPos = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng] as [number, number];
    return internalUserPos;
  }, [userLocation?.lat, userLocation?.lng, internalUserPos]);

  // Auto-detect location on mount if no location provided
  useEffect(() => {
    if (!userLocation) {
      handleLocate();
    }
  }, [userLocation]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    
    setIsLocating(true);
    setLocationError(null);
    
    // Use clear timeout and descriptive error
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // Increased to 10 seconds
      maximumAge: 60000 // Allow up to 1-minute-old cached location
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setInternalUserPos(coords);
        setMapCenter(coords);
        setZoom(15);
        setIsLocating(false);
        setLocationError(null);
        console.log("Location detected:", coords);
      },
      (err) => {
        let msg = "Could not detect location.";
        switch(err.code) {
          case err.PERMISSION_DENIED:
            msg = "Location access denied. Please enable location permissions in your browser.";
            break;
          case err.POSITION_UNAVAILABLE:
            msg = "Location information is unavailable.";
            break;
          case err.TIMEOUT:
            msg = "Location request timed out. Trying again might help.";
            break;
        }
        
        console.error("Locate error:", err.code, err.message);
        setLocationError(`${msg} Showing default Kigali center.`);
        setIsLocating(false);
      },
      geoOptions
    );
  };

  const branchesWithDistance = useMemo(() => {
    const reference = effectiveUserPos || DEFAULT_CENTER;
    return SIMBA_BRANCHES.map(branch => ({
      ...branch,
      distance: getDistance(reference[0], reference[1], branch.lat, branch.lng)
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [effectiveUserPos]);

  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branchesWithDistance;
    return branchesWithDistance.filter(branch => 
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, branchesWithDistance]);

  const nearestBranch = useMemo(() => {
    return branchesWithDistance[0];
  }, [branchesWithDistance]);

  const handleSearchCommit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    // Local match first
    const match = branchesWithDistance.find(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (match) {
      setMapCenter([match.lat, match.lng]);
      setZoom(15);
      onSelectBranch(match);
      return;
    }

    // Attempt geocoding (Nominatim)
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ", Kigali, Rwanda")}`);
      const data = await resp.json();
      if (data && data.length > 0) {
        const newCoords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setMapCenter(newCoords);
        setInternalUserPos(newCoords); // Set as reference point for distance
        setZoom(15);
        setLocationError(null);
      } else {
        setLocationError("Location not found. Try 'Downtown' or 'Simba Supermarket'.");
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      setLocationError("Search service unavailable. Please check your connection.");
    }
  };

  const activeBranch = useMemo(() => {
    return SIMBA_BRANCHES.find(b => b.id === selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    if (activeBranch) {
      const branchCoords: [number, number] = [activeBranch.lat, activeBranch.lng];
      setMapCenter(prev => {
        if (prev[0] === branchCoords[0] && prev[1] === branchCoords[1]) return prev;
        return branchCoords;
      });
      setZoom(15);

      // Automatically fetch route if user position is known
      if (effectiveUserPos && activeRouteId !== activeBranch.id) {
        fetchRoute(effectiveUserPos, [activeBranch.lat, activeBranch.lng], activeBranch.id);
      }
    } else if (effectiveUserPos && !routeCoords.length) {
      setMapCenter(effectiveUserPos);
    }
  }, [activeBranch?.id, effectiveUserPos]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row gap-6 items-end">
        <form onSubmit={handleSearchCommit} className="relative group/search flex-1">
          <Search className={cn(
            "absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors",
            searchQuery ? "text-brand-primary" : "text-zinc-400 group-hover/search:text-brand-primary"
          )} />
          <input 
            type="text"
            placeholder="Type a location or branch name in Kigali..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-brand-border rounded-[32px] py-7 pl-16 pr-14 text-sm font-bold uppercase tracking-tight text-[var(--brand-text)] placeholder:text-zinc-500 outline-none transition-all shadow-xl focus:ring-4 focus:ring-brand-primary/10"
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-zinc-400"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </form>
        
        <button 
          onClick={handleLocate}
          disabled={isLocating}
          className="flex items-center gap-3 px-8 py-7 bg-brand-primary text-white dark:text-black rounded-[32px] font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all shadow-xl disabled:opacity-50"
        >
          {isLocating ? <Locate className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          {isLocating ? 'Detecting...' : 'Near Me'}
        </button>
      </div>

      <AnimatePresence>
        {locationError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-tight"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {locationError}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col gap-10">
        {/* Leaflet Map */}
        <div className="relative rounded-[48px] overflow-hidden border border-brand-border h-[600px] shadow-2xl shadow-brand-primary/10 z-0">
          <MapContainer 
            center={mapCenter} 
            zoom={zoom} 
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <ChangeView center={mapCenter} zoom={zoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="grayscale brightness-90 contrast-125"
            />
            
            {filteredBranches.map((branch) => (
              <Marker 
                key={branch.id} 
                position={[branch.lat, branch.lng]}
                icon={selectedBranch === branch.id ? selectedIcon : customIcon}
                eventHandlers={{
                  click: () => onSelectBranch(branch),
                }}
              >
                <Popup className="simba-popup">
                  <div className="p-2 min-w-[150px]">
                    <h4 className="font-black italic uppercase text-xs text-brand-primary mb-1">{branch.name}</h4>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase leading-tight mb-2">{branch.address}</p>
                    {branch.distance !== undefined && (
                      <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest mb-3">{branch.distance.toFixed(1)} km from you</p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (effectiveUserPos) {
                          fetchRoute(effectiveUserPos, [branch.lat, branch.lng], branch.id);
                        } else {
                          handleLocate();
                        }
                      }}
                      className="w-full py-2 bg-brand-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
                    >
                      <Navigation className="h-3 w-3" />
                      Get Route
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {effectiveUserPos && (
              <>
                <Marker position={effectiveUserPos} icon={userIcon}>
                  <Popup><span className="text-[10px] font-black uppercase italic">{userLocation ? 'Target Location' : 'You are here'}</span></Popup>
                </Marker>
                <Circle 
                  center={effectiveUserPos} 
                  pathOptions={{ 
                    color: '#0ea5e9', 
                    fillColor: '#0ea5e966',
                    fillOpacity: 0.3,
                    weight: 2
                  }} 
                  radius={400} 
                  className="animate-pulse"
                />
                <Circle 
                  center={effectiveUserPos} 
                  pathOptions={{ 
                    color: '#0ea5e9', 
                    fillColor: '#0ea5e9',
                    fillOpacity: 1,
                    weight: 0
                  }} 
                  radius={15} 
                />
              </>
            )}

            {routeCoords.length > 0 && (
              <Polyline 
                positions={routeCoords} 
                pathOptions={{ 
                  color: '#FF6B00', 
                  weight: 5, 
                  opacity: 0.8,
                  lineJoin: 'round',
                  dashArray: '10, 10',
                  dashOffset: '0'
                }} 
              />
            )}
          </MapContainer>
          
          <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
            <AnimatePresence>
              {isLocating && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-4 py-2 bg-brand-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Pinpointing Location...</span>
                </motion.div>
              )}
              {effectiveUserPos && !isLocating && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-4 py-2 bg-green-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl"
                >
                  <MapPin className="h-3 w-3 fill-white" />
                  <span>Location Active</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
            <AnimatePresence>
              {routeCoords.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={clearRoute}
                  className="px-4 py-2 bg-red-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear Route
                </motion.button>
              )}
            </AnimatePresence>
            <div className="px-4 py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-full border border-brand-border text-[9px] font-black italic uppercase tracking-widest text-brand-primary flex items-center gap-2 shadow-xl">
              <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>Simba Stores</span>
              </div>
              <div className="w-[1px] h-3 bg-brand-border" />
              <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 fill-sky-500 text-sky-500" />
                  <span>{userLocation ? 'Search' : 'You'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Results Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-brand-primary rounded-full" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-[var(--brand-text)]">
                {t('local_stores')}
              </h3>
            </div>
            <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full italic tracking-widest uppercase">
              {filteredBranches.length} {filteredBranches.length === 1 ? t('store') : t('branches').toUpperCase()} {t('found').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map((branch, idx) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -6 }}
                role="button"
                tabIndex={0}
                onClick={() => onSelectBranch(branch)}
                className={cn(
                  "p-8 rounded-[48px] transition-all border text-left flex flex-col justify-between min-h-[220px] cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-brand-primary group relative overflow-hidden",
                  selectedBranch === branch.id 
                    ? "bg-brand-primary border-brand-primary text-white shadow-2xl shadow-brand-primary/40 ring-4 ring-brand-primary/10" 
                    : "bg-white dark:bg-zinc-950 border-brand-border hover:border-brand-primary/50 shadow-sm"
                )}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {idx === 0 && effectiveUserPos && (
                        <span className="text-[8px] font-black uppercase bg-green-500 text-white px-2 py-1 rounded-md mb-2 inline-block tracking-widest">{t('closest_to_you')}</span>
                      )}
                      <p className={cn(
                        "font-black italic uppercase tracking-tighter text-2xl leading-tight group-hover:scale-105 transition-transform origin-left",
                        selectedBranch === branch.id ? "text-white" : "text-[var(--brand-text)]"
                      )}>
                        {branch.name.replace('Simba ', '')}
                      </p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl transition-all",
                      selectedBranch === branch.id ? "bg-white/20 text-white" : "bg-brand-primary/10 text-brand-primary"
                    )}>
                      <MapPin className="h-5 w-5" />
                    </div>
                  </div>
                  <p className={cn(
                    "text-[11px] font-bold uppercase opacity-60 leading-relaxed max-w-[90%]",
                    selectedBranch === branch.id ? "text-white" : "text-zinc-500"
                  )}>
                    {branch.address}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-3 py-1.5 rounded-xl",
                      selectedBranch === branch.id ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/5 text-zinc-500"
                    )}>
                      {branch.id === 'town-center' ? t('city_hub') : t('local_store')}
                    </span>
                    {branch.distance !== undefined && (
                      <span className={cn(
                        "text-[10px] font-black flex items-center gap-1",
                        selectedBranch === branch.id ? "text-white/80" : "text-brand-primary"
                      )}>
                        <Navigation className="h-3 w-3" />
                        {branch.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  
                  {selectedBranch === branch.id && (
                    <div className="flex gap-2">
                       <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (effectiveUserPos) {
                            fetchRoute(effectiveUserPos, [branch.lat, branch.lng], branch.id);
                          } else {
                            handleLocate();
                          }
                        }}
                        disabled={isRouting}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                          activeRouteId === branch.id 
                            ? "bg-white text-brand-primary" 
                            : "bg-white/20 text-white hover:bg-white/30"
                        )}
                      >
                        {isRouting && activeRouteId === branch.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Navigation className="h-3 w-3" />
                        )}
                        {activeRouteId === branch.id ? 'Routing...' : 'Route'}
                      </button>
                      <motion.div 
                        layoutId="active-check"
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-primary shadow-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-current animate-ping" />
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Abstract background graphics */}
                <div className={cn(
                  "absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl transition-opacity",
                  selectedBranch === branch.id ? "bg-white/20 opacity-100" : "bg-brand-primary/5 opacity-0 group-hover:opacity-100"
                )} />
              </motion.div>
            ))}
            
            {filteredBranches.length === 0 && (
              <div className="col-span-full py-32 text-center bg-black/5 dark:bg-white/5 rounded-[64px] border border-dashed border-brand-border">
                <Search className="h-16 w-16 mx-auto text-brand-border mb-6 opacity-20" />
                <p className="text-xl font-black uppercase italic opacity-40 tracking-tighter">{t('no_branches_found')}</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-6 text-brand-primary font-black uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-4"
                >
                  {t('clear_search_show_all')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

