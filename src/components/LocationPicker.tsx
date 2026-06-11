import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L, { type LatLngExpression, type LeafletEvent } from "leaflet";
import "leaflet/dist/leaflet.css";

type LocationValue = {
  latitude: string;
  longitude: string;
  address: string;
};

type LocationPickerProps = {
  value: LocationValue;
  onChange: (next: Partial<LocationValue>) => void;
  label?: string;
  hint?: string;
};

const DEFAULT_CENTER: LatLngExpression = [-6.2088, 106.8456];

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function parsePosition(value: LocationValue) {
  const latitude = Number.parseFloat(value.latitude);
  const longitude = Number.parseFloat(value.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { lat: latitude, lng: longitude };
}

async function reverseGeocode(latitude: number, longitude: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=id&addressdetails=1`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Reverse geocode failed");
  }

  const data = (await response.json()) as { display_name?: string };
  return data.display_name ?? "";
}

function LocationMap({
  position,
  onPick,
}: {
  position: { lat: number; lng: number } | null;
  onPick: (latitude: number, longitude: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15), {
        animate: true,
      });
    }
  }, [map, position]);

  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  if (!position) {
    return null;
  }

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={markerIcon}
      draggable
      eventHandlers={{
        dragend(event: LeafletEvent) {
          const marker = event.target as L.Marker;
          const { lat, lng } = marker.getLatLng();
          onPick(lat, lng);
        },
      }}
    />
  );
}

export function LocationPicker({ value, onChange, label = "Pilih titik lokasi", hint = "Klik peta atau geser pin untuk mengisi koordinat dan alamat otomatis." }: LocationPickerProps) {
  const position = useMemo(() => parsePosition(value), [value]);
  const requestRef = useRef(0);
  const [isResolving, setIsResolving] = useState(false);

  const handlePick = async (latitude: number, longitude: number) => {
    const nextLatitude = latitude.toFixed(6);
    const nextLongitude = longitude.toFixed(6);
    onChange({ latitude: nextLatitude, longitude: nextLongitude });

    const requestId = ++requestRef.current;
    setIsResolving(true);
    try {
      const resolvedAddress = await reverseGeocode(latitude, longitude);
      if (requestRef.current !== requestId) return;
      if (resolvedAddress) {
        onChange({ address: resolvedAddress });
      }
    } catch {
      // Keep the selected coordinates even if reverse geocoding fails.
    } finally {
      if (requestRef.current === requestId) {
        setIsResolving(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
        {isResolving && <p className="text-[11px] text-muted-foreground">Mengambil alamat...</p>}
      </div>
      <div className="overflow-hidden rounded-xl border bg-muted/20">
        <MapContainer
          center={position ?? DEFAULT_CENTER}
          zoom={position ? 15 : 12}
          scrollWheelZoom
          className="h-[280px] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMap position={position} onPick={handlePick} />
        </MapContainer>
      </div>
    </div>
  );
}