import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Users, MapPin } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Fix for default Leaflet icon paths in React
delete (L.Icon.Default.prototype as any)._getIconUrl;

const createIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icons = {
  office: createIcon('green'),
  remote: createIcon('blue'),
  traveling: createIcon('yellow'),
  risk: createIcon('red')
};

// Removed mockLocations

const WorkforceMap = React.memo(function WorkforceMap({ locations, companyLocation }: { locations: any[], companyLocation?: any }) {
  const { isDark } = useTheme();
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(100);

  useEffect(() => {
    let center: [number, number] = [20.5937, 78.9629]; // India center
    let radius = 100;

    if (companyLocation && companyLocation.lat && companyLocation.lng) {
      center = [companyLocation.lat, companyLocation.lng];
      radius = companyLocation.radius || 100;
    }

    setMapCenter(center);
    setGeofenceRadius(radius);
  }, [companyLocation]);

  // Update center if locations arrive and no company geofence
  useEffect(() => {
    if (locations.length > 0 && mapCenter && mapCenter[0] === 20.5937) {
      setMapCenter([locations[0].lat, locations[0].lng]);
    }
  }, [locations, mapCenter]);

  const mapContent = useMemo(() => {
    if (!mapCenter) return null;
    return (
    <MapContainer center={mapCenter} zoom={mapCenter[0] === 20.5937 ? 5 : 11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"} />
      <ZoomControl position="bottomright" />
      <Circle center={mapCenter} radius={geofenceRadius} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15, weight: 2 }} />
      <LayerGroup>
        {(Array.isArray(locations) ? locations : []).filter(loc => loc && loc.lat != null && loc.lng != null && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)).map(loc => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={icons[loc.type as keyof typeof icons] || icons.office}>
            <Popup>
              <div style={{ padding: '4px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>{loc.name}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Type: <span style={{ textTransform: 'capitalize' }}>{loc.type}</span></div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trust Score: <span style={{ color: loc.trust > 80 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{loc.trust}%</span></div>
              </div>
            </Popup>
          </Marker>
        ))}
      </LayerGroup>
    </MapContainer>
    );
  }, [isDark, locations, mapCenter, geofenceRadius]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="premium-card" style={{ padding: '24px', height: '500px', display: 'flex', flexDirection: 'column', background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', backdropFilter: 'blur(10px)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <MapPin size={20} color="#3b82f6" /> Global Workforce Map
        </h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
            <Users size={16} color="#10b981" />
            <span style={{ color: 'var(--text-color)' }}>{locations.length} Active</span>
          </div>
        </div>
      </div>
      
      <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', position: 'relative' }}>
        {mapContent}
        
        {/* Map Legend */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 400, background: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-muted)' }}>Status Legend</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}/> Office</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}/> Remote</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }}/> Traveling</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}/> High Risk</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default WorkforceMap;
