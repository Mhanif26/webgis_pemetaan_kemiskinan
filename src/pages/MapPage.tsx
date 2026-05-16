import { useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Navigation, RotateCcw } from "lucide-react";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const ActiveRecipientIcon = L.divIcon({
  className: "custom-div-icon",
  html: `<div style="background:#10b981;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 2px 4px rgba(0,0,0,0.3);border:2px solid white;font-weight:bold;">A</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const PendingRecipientIcon = L.divIcon({
  className: "custom-div-icon",
  html: `<div style="background:#f59e0b;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 2px 4px rgba(0,0,0,0.3);border:2px solid white;font-weight:bold;">P</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const RejectedRecipientIcon = L.divIcon({
  className: "custom-div-icon",
  html: `<div style="background:#ef4444;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 2px 4px rgba(0,0,0,0.3);border:2px solid white;font-weight:bold;">R</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const WORSHIP_TYPE_EMOJI: Record<string, string> = {
  mosque: "🕌",
  church: "⛪",
  temple: "🛕",
  vihara: "☸️",
  other: "🙏",
};

function getChurchIcon(type: string) {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background:#4f46e5;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;cursor:pointer;">${WORSHIP_TYPE_EMOJI[type] || "🙏"}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function getRecipientIcon(status: string) {
  switch (status) {
    case "active": return ActiveRecipientIcon;
    case "pending": return PendingRecipientIcon;
    case "rejected": return RejectedRecipientIcon;
    default: return DefaultIcon;
  }
}

const STATUS_FILTER = {
  all: "Semua Status",
  active: "Penerima Aktif",
  pending: "Menunggu Verifikasi",
  rejected: "Tidak Layak",
};

const TYPE_FILTER = {
  all: "Semua Tipe",
  mosque: "Masjid",
  church: "Gereja",
  temple: "Pura",
  vihara: "Vihara",
  other: "Lainnya",
};

export default function MapPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showRadius, setShowRadius] = useState(true);

  const { data: places, isLoading: placesLoading } =
    trpc.placeOfWorship.list.useQuery({
      type: typeFilter === "all" ? undefined : typeFilter,
    });

  const { data: recipients, isLoading: recipientsLoading } =
    trpc.recipient.list.useQuery({
      status: statusFilter === "all" ? undefined : statusFilter,
    });

  const defaultCenter: LatLngExpression = [-6.2088, 106.8456];

  const filteredRecipients = useMemo(() => {
    return (recipients ?? []).filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (r.latitude && r.longitude) return true;
      return false;
    });
  }, [recipients, statusFilter]);

  const isLoading = placesLoading || recipientsLoading;

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-700";
      case "pending": return "bg-amber-100 text-amber-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Peta GIS</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Visualisasi sebaran penerima bantuan dan cakupan rumah ibadah
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filter:
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_FILTER).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_FILTER).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-lg"
              onClick={() => setShowRadius(!showRadius)}
            >
              <Navigation className="h-3 w-3 mr-1" />
              {showRadius ? "Sembunyikan Radius" : "Tampilkan Radius"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs rounded-lg"
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("all");
                setShowRadius(true);
              }}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="rounded-2xl shadow-sm border-0 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="h-[500px] w-full" />
          ) : (
            <div className="h-[500px] w-full">
              <MapContainer
                center={defaultCenter}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {/* Place of Worship Markers & Circles */}
                {(places ?? []).map((place) => {
                  const lat = parseFloat(place.latitude?.toString() ?? "0");
                  const lng = parseFloat(place.longitude?.toString() ?? "0");
                  if (!lat || !lng) return null;
                  return (
                    <div key={`pow-${place.id}`}>
                      <Marker
                        position={[lat, lng]}
                        icon={getChurchIcon(place.type)}
                      >
                        <Popup>
                          <div className="min-w-[200px] space-y-2">
                            <h3 className="font-semibold text-sm">{place.name}</h3>
                            <Badge
                              variant="outline"
                              className="text-[10px] capitalize"
                            >
                              {place.type}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {place.address}
                            </p>
                            <div className="text-xs space-y-1">
                              <p>
                                <span className="font-medium">Radius:</span>{" "}
                                {place.radius}m
                              </p>
                              <p>
                                <span className="font-medium">Kapasitas:</span>{" "}
                                {place.capacity} orang
                              </p>
                              {place.contactName && (
                                <p>
                                  <span className="font-medium">Kontak:</span>{" "}
                                  {place.contactName}
                                </p>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                      {showRadius && (
                        <Circle
                          center={[lat, lng]}
                          radius={place.radius ?? 1000}
                          pathOptions={{
                            color: "#4f46e5",
                            fillColor: "#4f46e5",
                            fillOpacity: 0.08,
                            weight: 1,
                            dashArray: "5, 5",
                          }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Recipient Markers */}
                {filteredRecipients.map((recipient) => {
                  const lat = parseFloat(recipient.latitude?.toString() ?? "0");
                  const lng = parseFloat(recipient.longitude?.toString() ?? "0");
                  if (!lat || !lng) return null;
                  return (
                    <Marker
                      key={`rec-${recipient.id}`}
                      position={[lat, lng]}
                      icon={getRecipientIcon(recipient.status)}
                    >
                      <Popup>
                        <div className="min-w-[180px] space-y-1.5">
                          <h3 className="font-semibold text-sm">
                            {recipient.name}
                          </h3>
                          <Badge
                            className={`text-[10px] capitalize ${statusColor(
                              recipient.status
                            )}`}
                            variant="secondary"
                          >
                            {recipient.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            NIK: {recipient.nik}
                          </p>
                          {recipient.address && (
                            <p className="text-xs text-muted-foreground">
                              {recipient.address}
                            </p>
                          )}
                          <div className="text-xs">
                            <p>
                              <span className="font-medium">Anggota Keluarga:</span>{" "}
                              {recipient.familyMembers}
                            </p>
                            <p>
                              <span className="font-medium">Pendapatan:</span> Rp{" "}
                              {recipient.incomePerMonth?.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium">Keterangan:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-indigo-600" />
          <span>Rumah Ibadah</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Penerima Aktif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Menunggu Verifikasi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Tidak Layak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded-full border border-dashed border-indigo-600"
            style={{ background: "rgba(79,70,229,0.08)" }}
          />
          <span>Radius Cakupan</span>
        </div>
      </div>
    </div>
  );
}
