'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon Leaflet di webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const officeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng])
  return null
}

interface AbsensiMapProps {
  officeLat: number
  officeLng: number
  radiusMeter: number
  userLat?: number
  userLng?: number
}

export default function AbsensiMap({
  officeLat,
  officeLng,
  radiusMeter,
  userLat,
  userLng,
}: AbsensiMapProps) {
  const centerLat = userLat ?? officeLat
  const centerLng = userLng ?? officeLng

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700" style={{ height: 280, isolation: 'isolate' }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Radius kantor */}
        <Circle
          center={[officeLat, officeLng]}
          radius={radiusMeter}
          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 2 }}
        />

        {/* Marker kantor */}
        <Marker position={[officeLat, officeLng]} icon={officeIcon}>
          <Popup>📍 Lokasi Kantor</Popup>
        </Marker>

        {/* Marker posisi user */}
        {userLat !== undefined && userLng !== undefined && (
          <>
            <RecenterMap lat={userLat} lng={userLng} />
            <Marker position={[userLat, userLng]} icon={userIcon}>
              <Popup>📌 Posisi Kamu</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  )
}
