'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prev = useRef({ lat, lng })
  useEffect(() => {
    if (prev.current.lat !== lat || prev.current.lng !== lng) {
      map.setView([lat, lng], map.getZoom())
      prev.current = { lat, lng }
    }
  }, [lat, lng])
  return null
}

interface MapPickerProps {
  lat: number
  lng: number
  radiusMeter: number
  onChange: (lat: number, lng: number) => void
}

export default function MapPicker({ lat, lng, radiusMeter, onChange }: MapPickerProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 relative" style={{ height: 320, isolation: 'isolate' }}>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-zinc-800 text-xs text-zinc-500 px-3 py-1.5 rounded-full shadow pointer-events-none">
        Klik pada peta untuk pindahkan lokasi kantor
      </div>
      <MapContainer
        center={[lat, lng]}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onMapClick={onChange} />
        <RecenterMap lat={lat} lng={lng} />

        <Circle
          center={[lat, lng]}
          radius={radiusMeter}
          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 2 }}
        />

        <Marker
          position={[lat, lng]}
          icon={officeIcon}
          draggable
          eventHandlers={{
            dragend(e) {
              const { lat: newLat, lng: newLng } = (e.target as L.Marker).getLatLng()
              onChange(newLat, newLng)
            },
          }}
        />
      </MapContainer>
    </div>
  )
}
