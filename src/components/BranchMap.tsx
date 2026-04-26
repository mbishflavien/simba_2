import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Star, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface Branch {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
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

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '24px'
};

const center = {
  lat: -1.9441,
  lng: 30.0619
};

interface BranchMapProps {
  onSelectBranch: (branch: Branch) => void;
  selectedBranch?: string;
  userLocation?: { lat: number; lng: number } | null;
}

export default function BranchMap({ onSelectBranch, selectedBranch, userLocation }: BranchMapProps) {
  const { t } = useTranslation();
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBranches = useMemo(() => {
    return SIMBA_BRANCHES.filter(branch => 
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || "";
  const [isExpanded, setIsExpanded] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    version: 'weekly',
    libraries: ['places' as any]
  });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Sync map bounds with markers
  React.useEffect(() => {
    if (!map || !isLoaded || !window.google) return;
    
    try {
      const bounds = new window.google.maps.LatLngBounds();
      SIMBA_BRANCHES.forEach(branch => {
        bounds.extend({ lat: branch.lat, lng: branch.lng });
      });
      
      if (userLocation) {
        bounds.extend(userLocation);
      }
      
      map.fitBounds(bounds);

      // If userLocation exists, they probably want to see where they are
      if (userLocation) {
        map.setZoom(13);
        map.panTo(userLocation);
      }
    } catch (e) {
      console.error("Map bounds error:", e);
    }
  }, [map, isLoaded, userLocation]);

  // If a branch is selected via the list, pan to it
  React.useEffect(() => {
    if (!map || !selectedBranch || !window.google) return;
    const branch = SIMBA_BRANCHES.find(b => b.id === selectedBranch);
    if (branch) {
      map.panTo({ lat: branch.lat, lng: branch.lng });
      map.setZoom(15);
    }
  }, [map, selectedBranch]);

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const directionsCallback = useCallback((result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (result !== null && status === 'OK') {
      setDirections(result);
      setDirectionsError(null);
    } else if (status === 'REQUEST_DENIED') {
      setDirectionsError('Directions API not enabled or Key restricted.');
      console.error('Directions Error:', status);
    } else {
      setDirectionsError('Could not calculate route.');
      console.error('Directions Error:', status);
    }
  }, []);

  // Clear directions when selected branch or user location changes
  useEffect(() => {
    setDirections(null);
    setDirectionsError(null);
  }, [selectedBranch, userLocation]);

  const nearestBranch = useMemo(() => {
    if (!userLocation) return null;

    const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let minDist = Infinity;
    let closest: Branch | null = null;

    SIMBA_BRANCHES.forEach(branch => {
      const d = getDist(userLocation.lat, userLocation.lng, branch.lat, branch.lng);
      if (d < minDist) {
        minDist = d;
        closest = branch;
      }
    });

    return closest;
  }, [userLocation]);

  if (!apiKey) {
    return (
      <div className="h-[500px] bg-zinc-900 rounded-[40px] border border-white/10 flex flex-col items-center justify-center p-8 text-center">
        <MapPin className="h-12 w-12 text-brand-primary opacity-20 mb-4" />
        <h3 className="font-black uppercase italic text-white mb-2">Maps API Key Missing</h3>
        <p className="text-[10px] font-bold uppercase opacity-40 text-white/60 leading-relaxed max-w-sm italic">
          Please configure VITE_GOOGLE_MAPS_API_KEY in your .env or secrets to enable interactive maps and directions.
        </p>
      </div>
    );
  }

  if (!isLoaded && !loadError) return <div className="h-[500px] bg-black/5 dark:bg-white/5 animate-pulse rounded-[40px]" />;

  const handleOpenExternal = (branch: Branch) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Search & List Sidebar (Desktop) */}
        {!isExpanded && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-[360px] flex flex-col gap-4 order-2 lg:order-1"
          >
            {/* Nearest Branch Card */}
            <AnimatePresence mode="wait">
              {nearestBranch && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-[32px] overflow-hidden relative group"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Star className="h-16 w-16 fill-brand-primary" />
                  </div>
                  <p className="micro-label !text-brand-primary uppercase font-black mb-1">{t('nearest_branch')}</p>
                  <h4 className="font-black italic uppercase tracking-tight text-xl text-[var(--brand-text)] leading-tight mb-2">
                    {nearestBranch.name}
                  </h4>
                  <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase leading-relaxed mb-4">
                    {nearestBranch.address}
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onSelectBranch(nearestBranch)}
                      className="flex-1 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-brand-primary/20"
                    >
                      Select Branch
                    </button>
                    <button 
                      onClick={() => handleOpenExternal(nearestBranch)}
                      className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-brand-border hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <Navigation className="h-4 w-4 text-[var(--brand-text)]" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List Card */}
            <div className="flex-1 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-[32px] border border-brand-border flex flex-col overflow-hidden min-h-[400px]">
              <div className="p-6 border-b border-brand-border space-y-4 bg-white/50 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <p className="micro-label font-black uppercase tracking-[0.2em] opacity-40 italic font-sans">{t('supermarket_network')}</p>
                  <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full italic">
                    {filteredBranches.length}
                  </span>
                </div>
                
                {/* Enhanced Search Input */}
                <div className="relative group/search">
                  <Search className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors",
                    searchQuery ? "text-brand-primary" : "text-zinc-400 group-hover/search:text-brand-primary"
                  )} />
                  <input 
                    type="text"
                    placeholder="Search branches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-brand-primary/30 focus:bg-white dark:focus:bg-zinc-800 rounded-2xl py-3.5 pl-11 pr-10 text-[11px] font-bold uppercase tracking-tight text-[var(--brand-text)] placeholder:text-zinc-500 outline-none transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all"
                    >
                      <X className="h-3 w-3 text-zinc-500" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredBranches.length > 0 ? (
                  filteredBranches.map(branch => (
                    <button
                      key={branch.id}
                      onClick={() => onSelectBranch(branch)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group border",
                        selectedBranch === branch.id 
                          ? "bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/30" 
                          : "bg-white/50 dark:bg-black/20 border-transparent hover:border-brand-primary/30 hover:bg-white dark:hover:bg-zinc-800 text-[var(--brand-text)]"
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className={cn(
                          "font-black italic uppercase tracking-tighter text-sm truncate",
                          selectedBranch === branch.id ? "text-white" : "text-[var(--brand-text)]"
                        )}>
                          {branch.name}
                        </p>
                        <p className={cn(
                          "text-[9px] font-bold uppercase truncate opacity-50",
                          selectedBranch === branch.id ? "text-white" : "text-zinc-500"
                        )}>
                          {branch.address}
                        </p>
                      </div>
                      <MapPin className={cn(
                        "h-3 w-3 shrink-0 transition-transform",
                        selectedBranch === branch.id ? "text-white scale-125" : "text-brand-primary opacity-20 group-hover:opacity-100"
                      )} />
                    </button>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-10 w-10 text-zinc-400 opacity-10 mb-4" />
                    <p className="text-[10px] font-black uppercase italic opacity-30">No matches found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-brand-border bg-black/5 dark:bg-white/5">
                <button 
                  onClick={() => window.open('https://www.google.com/maps/search/Simba+Supermarket+Kigali', '_blank')}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-brand-primary/5 transition-all text-[10px] font-black uppercase tracking-widest text-[var(--brand-text)] opacity-40 hover:opacity-100 italic"
                >
                  <Navigation className="h-3 w-3" />
                  Global Search in Maps
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Map Container */}
        <div className="flex-1 order-1 lg:order-2">
          <div className="relative rounded-[48px] overflow-hidden border border-brand-border h-[600px] lg:h-[700px] shadow-2xl shadow-brand-primary/10">
            {/* Map Expand Toggle (Desktop) */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden lg:flex absolute top-6 right-6 z-10 p-3 bg-zinc-900/90 text-white backdrop-blur-md rounded-2xl border border-white/10 hover:bg-brand-primary transition-all shadow-xl items-center gap-2 group"
            >
              <div className="flex flex-col gap-0.5 items-center justify-center w-4 h-4 overflow-hidden">
                <div className={cn("w-full h-0.5 bg-current transition-transform", isExpanded ? "rotate-45 translate-y-1" : "")} />
                {!isExpanded && <div className="w-full h-0.5 bg-current" />}
                <div className={cn("w-full h-0.5 bg-current transition-transform", isExpanded ? "-rotate-45 -translate-y-1" : "")} />
              </div>
              <span className="text-[10px] font-black uppercase italic tracking-widest hidden group-hover:block">
                {isExpanded ? 'Restore Sidebar' : 'Expand Map'}
              </span>
            </button>

            {!apiKey && (
              <div className="absolute top-6 left-6 lg:left-auto lg:bottom-6 lg:right-6 lg:top-auto z-20 px-4 py-2 bg-zinc-900/80 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black italic uppercase tracking-widest text-brand-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                Live Preview Mode
              </div>
            )}
            
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={center}
              zoom={12}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                styles: [
                  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
                  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
                  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
                  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
                  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
                  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] }
                ],
                disableDefaultUI: true,
                zoomControl: true,
                zoomControlOptions: {
                  position: window.google?.maps?.ControlPosition?.RIGHT_CENTER
                }
              }}
            >
              {filteredBranches.map((branch) => (
                <Marker
                  key={branch.id}
                  position={{ lat: branch.lat, lng: branch.lng }}
                  onClick={() => {
                    setActiveMarker(branch.id);
                    onSelectBranch(branch);
                  }}
                  icon={{
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                    fillColor: selectedBranch === branch.id ? '#FF5500' : '#888888',
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: '#FFFFFF',
                    scale: 1.5,
                  }}
                />
              ))}

              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#3B82F6',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#FFFFFF',
                    scale: 6,
                  }}
                />
              )}

              {activeMarker && (
                <InfoWindow
                  position={SIMBA_BRANCHES.find(b => b.id === activeMarker)!}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div className="p-3 min-w-[200px]">
                    <h4 className="font-black italic uppercase text-xs text-brand-primary mb-1">
                      {SIMBA_BRANCHES.find(b => b.id === activeMarker)?.name}
                    </h4>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase leading-tight mb-3">
                      {SIMBA_BRANCHES.find(b => b.id === activeMarker)?.address}
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenExternal(SIMBA_BRANCHES.find(b => b.id === activeMarker)!)}
                        className="flex-1 py-2 bg-brand-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-sm"
                      >
                        View Directions
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}

              {userLocation && selectedBranch && !directions && !directionsError && apiKey && (
                <DirectionsService
                  options={{
                    origin: userLocation,
                    destination: {
                      lat: SIMBA_BRANCHES.find(b => b.id === selectedBranch)!.lat,
                      lng: SIMBA_BRANCHES.find(b => b.id === selectedBranch)!.lng,
                    },
                    travelMode: google.maps.TravelMode.DRIVING,
                  }}
                  callback={directionsCallback}
                />
              )}

              {directions && (
                <DirectionsRenderer
                  options={{
                    directions: directions,
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: '#FF5500',
                      strokeWeight: 6,
                      strokeOpacity: 1,
                    },
                  }}
                />
              )}
            </GoogleMap>

            {/* Directions / Error Floating Footer (Desktop/Mobile) */}
            <AnimatePresence>
              {directionsError && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-lg p-6 bg-zinc-900 text-white rounded-[32px] border border-white/10 shadow-2xl z-30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                      <Navigation className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase italic tracking-widest mb-0.5">Route Restricted</p>
                      <p className="text-[9px] opacity-40 font-bold uppercase italic">Billing required for in-app directions</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => selectedBranch && handleOpenExternal(SIMBA_BRANCHES.find(b => b.id === selectedBranch)!)}
                    className="px-6 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-brand-primary/20"
                  >
                    Go to Google Maps
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile-Only Branch List (Cards at bottom) */}
      <div className="lg:hidden mt-6 space-y-4 px-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="micro-label font-black uppercase tracking-[0.2em] opacity-40 italic">Pickup Locations</p>
            <button 
              onClick={() => window.open('https://www.google.com/maps/search/Simba+Supermarket+Kigali', '_blank')}
              className="flex items-center gap-1.5 text-[9px] font-black uppercase text-brand-primary hover:underline italic"
            >
              <Navigation className="h-3 w-3" />
              Full Maps
            </button>
          </div>

          {/* Enhanced Mobile Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input 
              type="text"
              placeholder="Filter branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-brand-border rounded-2xl py-3.5 pl-11 pr-4 text-[11px] font-bold uppercase outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
          {filteredBranches.length > 0 ? (
            filteredBranches.map(branch => (
              <div
                key={branch.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectBranch(branch)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectBranch(branch);
                  }
                }}
                className={cn(
                  "p-5 rounded-[28px] transition-all border text-left flex flex-col justify-between h-[140px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                  selectedBranch === branch.id 
                    ? "bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20" 
                    : "bg-white dark:bg-zinc-900 border-brand-border"
                )}
              >
                <div>
                  <p className={cn(
                    "font-black italic uppercase tracking-tighter text-base leading-tight",
                    selectedBranch === branch.id ? "text-white" : "text-[var(--brand-text)]"
                  )}>
                    {branch.name}
                  </p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase mt-1 opacity-60",
                    selectedBranch === branch.id ? "text-white" : "text-zinc-500"
                  )}>
                    {branch.address}
                  </p>
                </div>
                {selectedBranch === branch.id && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenExternal(branch); }}
                    className="flex items-center gap-2 text-[9px] font-black uppercase bg-white/20 px-3 py-1.5 rounded-lg w-fit mt-2 hover:bg-white/30 transition-colors"
                  >
                    <Navigation className="h-3 w-3" />
                    Get Directions
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="w-full py-8 text-center bg-black/5 dark:bg-white/5 rounded-[28px] border border-dashed border-brand-border">
              <p className="text-[10px] font-black uppercase italic opacity-40">No branches found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
