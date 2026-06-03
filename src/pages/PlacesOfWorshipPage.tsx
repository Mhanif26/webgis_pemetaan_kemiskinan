import { useMemo, useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { LocationPicker } from "@/components/LocationPicker";
import { DocumentUploadField } from "@/components/DocumentUploadField";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Church,
  MapPin,
  Phone,
  Users,
  Navigation,
  Eye,
} from "lucide-react";

const TYPE_OPTIONS = [
  { value: "all", label: "Semua Tipe" },
  { value: "mosque", label: "Masjid" },
  { value: "church", label: "Gereja" },
  { value: "temple", label: "Pura" },
  { value: "vihara", label: "Vihara" },
  { value: "other", label: "Lainnya" },
];

const TYPE_LABELS: Record<string, string> = {
  mosque: "Masjid",
  church: "Gereja",
  temple: "Pura",
  vihara: "Vihara",
  other: "Lainnya",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseRupiahInput(input: string) {
  const digits = input.replace(/\D/g, "");
  return digits ? Number.parseInt(digits, 10) : 0;
}

export default function PlacesOfWorshipPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const canModify = isAdmin; // Only Admin can modify Places of Worship
  const canDistribute = isAdmin || isManager; // Admin and Manager can distribute aid

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAidOpen, setIsAidOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<number | null>(null);
  const [aidForm, setAidForm] = useState({
    recipientId: 0,
    aidType: "Sembako",
    amount: 0,
    quantity: 1,
    unit: "paket",
    notes: "",
    handoverPhoto: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    type: "mosque" as "mosque" | "church" | "temple" | "vihara" | "other",
    address: "",
    latitude: "",
    longitude: "",
    radius: 1000,
    capacity: 100,
    contactName: "",
    contactPhone: "",
  });

  const utils = trpc.useUtils();
  const { data: places, isLoading } = trpc.placeOfWorship.list.useQuery({
    search: search || undefined,
    type: typeFilter === "all" ? undefined : typeFilter,
  });
  const { data: placeRecipients } = trpc.recipient.list.useQuery(
    { placeOfWorshipId: selectedPlace ?? undefined },
    { enabled: isAidOpen && selectedPlace !== null },
  );
  const { data: placeDistributions } = trpc.distribution.list.useQuery(
    { placeOfWorshipId: selectedPlace ?? undefined },
    { enabled: isAidOpen && selectedPlace !== null },
  );

  const createMutation = trpc.placeOfWorship.create.useMutation({
    onSuccess: () => {
      utils.placeOfWorship.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsAddOpen(false);
      resetForm();
    },
  });

  const updateMutation = trpc.placeOfWorship.update.useMutation({
    onSuccess: () => {
      utils.placeOfWorship.list.invalidate();
      setIsEditOpen(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.placeOfWorship.delete.useMutation({
    onSuccess: () => {
      utils.placeOfWorship.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });

  const createAidMutation = trpc.distribution.create.useMutation({
    onSuccess: () => {
      utils.distribution.list.invalidate();
      utils.dashboard.stats.invalidate();
      setAidForm({
        recipientId: 0,
        aidType: "Sembako",
        amount: 0,
        quantity: 1,
        unit: "paket",
        notes: "",
        handoverPhoto: "",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "mosque",
      address: "",
      latitude: "",
      longitude: "",
      radius: 1000,
      capacity: 100,
      contactName: "",
      contactPhone: "",
    });
    setSelectedPlace(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.latitude || !formData.longitude) return;
    createMutation.mutate({
      name: formData.name,
      type: formData.type,
      address: formData.address || undefined,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      radius: formData.radius,
      capacity: formData.capacity,
      contactName: formData.contactName || undefined,
      contactPhone: formData.contactPhone || undefined,
    });
  };

  const handleEdit = (place: NonNullable<typeof places>[number]) => {
    setFormData({
      name: place.name,
      type: place.type as typeof formData.type,
      address: place.address ?? "",
      latitude: place.latitude?.toString() ?? "",
      longitude: place.longitude?.toString() ?? "",
      radius: place.radius ?? 1000,
      capacity: place.capacity ?? 100,
      contactName: place.contactName ?? "",
      contactPhone: place.contactPhone ?? "",
    });
    setSelectedPlace(place.id);
    setIsEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;
    updateMutation.mutate({
      id: selectedPlace,
      name: formData.name,
      type: formData.type,
      address: formData.address || undefined,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      radius: formData.radius,
      capacity: formData.capacity,
      contactName: formData.contactName || undefined,
      contactPhone: formData.contactPhone || undefined,
    });
  };

  const selectedPlaceData = places?.find((p) => p.id === selectedPlace);
  const selectedPlaceRecipients = useMemo(
    () => (placeRecipients ?? []).filter((recipient) => recipient.placeOfWorshipId === selectedPlace),
    [placeRecipients, selectedPlace],
  );
  const selectedPlaceDistributions = useMemo(
    () => (placeDistributions ?? []).filter((distribution) => distribution.placeOfWorshipId === selectedPlace),
    [placeDistributions, selectedPlace],
  );
  const activeRecipients = selectedPlaceRecipients.filter((recipient) => recipient.status === "active");
  const totalAidAmount = selectedPlaceDistributions.reduce(
    (sum, distribution) => sum + Number.parseFloat(String(distribution.amount ?? 0)),
    0,
  );

  const updateFormData = (next: Partial<typeof formData>) => {
    setFormData((current) => ({ ...current, ...next }));
  };

  const handleAidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace || !aidForm.recipientId) return;
    if (!aidForm.handoverPhoto) {
      toast.error("Foto penyerahan wajib diunggah.");
      return;
    }
    createAidMutation.mutate({
      placeOfWorshipId: selectedPlace,
      recipientId: aidForm.recipientId,
      aidType: aidForm.aidType,
      amount: aidForm.amount,
      quantity: aidForm.quantity,
      unit: aidForm.unit,
      notes: aidForm.notes || undefined,
      handoverPhoto: aidForm.handoverPhoto,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rumah Ibadah</h2>
          <p className="text-muted-foreground mt-1 text-sm">Kelola data rumah ibadah dan cakupan wilayahnya</p>
        </div>
        {canModify && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Rumah Ibadah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Tambah Rumah Ibadah</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Tempat Ibadah</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Tulis nama rumah ibadah" className="h-9" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipe</Label>
                    <Select value={formData.type} onValueChange={(v: typeof formData.type) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mosque">Masjid</SelectItem>
                        <SelectItem value="church">Gereja</SelectItem>
                        <SelectItem value="temple">Pura</SelectItem>
                        <SelectItem value="vihara">Vihara</SelectItem>
                        <SelectItem value="other">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kapasitas</Label>
                    <Input type="number" min={1} value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })} className="h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alamat</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Alamat lengkap" className="h-9" />
                </div>
                <LocationPicker
                  value={formData}
                  onChange={updateFormData}
                  label="Pilih lokasi rumah ibadah"
                  hint="Klik peta atau geser pin. Koordinat dan alamat akan terisi otomatis."
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Latitude</Label>
                    <Input value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="-6.xxxx" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Longitude</Label>
                    <Input value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="106.xxxx" className="h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Radius (meter)</Label>
                    <Input type="number" min={100} max={10000} value={formData.radius} onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) || 1000 })} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">No. Kontak</Label>
                    <Input value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="08xxxxxxxxxx" className="h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Kontak</Label>
                  <Input value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} placeholder="Nama penanggung jawab" className="h-9" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari nama..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (places ?? []).length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Church className="h-10 w-10 mx-auto mb-3 text-muted" />
          <p>Belum ada data rumah ibadah</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(places ?? []).map((place) => (
            <Card key={place.id} className="rounded-2xl shadow-sm border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="bg-white/20 text-white border-0 text-[10px] mb-2">{TYPE_LABELS[place.type]}</Badge>
                      <h3 className="font-semibold text-sm">{place.name}</h3>
                    </div>
                    <Church className="h-5 w-5 opacity-60" />
                  </div>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{place.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Navigation className="h-3.5 w-3.5 shrink-0" />
                    <span>Radius {place.radius}m</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>Kapasitas {place.capacity} orang</span>
                  </div>
                  {place.contactPhone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{place.contactPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 pt-2 flex-wrap">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedPlace(place.id); setIsViewOpen(true); }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {canModify && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(place)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canDistribute && (
                      <Button variant="secondary" size="sm" className="h-7 px-2 text-xs rounded-lg" onClick={() => { setSelectedPlace(place.id); setIsAidOpen(true); }}>
                        Bantuan
                      </Button>
                    )}
                    {canModify && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Hapus rumah ibadah ini?")) deleteMutation.mutate({ id: place.id }); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Aid Dialog */}
      <Dialog open={isAidOpen} onOpenChange={setIsAidOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manajemen Bantuan {selectedPlaceData ? `- ${selectedPlaceData.name}` : ""}</DialogTitle>
          </DialogHeader>
          {selectedPlaceData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="rounded-xl border bg-muted/20">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Total Penerima</p>
                    <p className="text-2xl font-bold">{selectedPlaceRecipients.length}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border bg-muted/20">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Penerima Aktif</p>
                    <p className="text-2xl font-bold">{activeRecipients.length}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border bg-muted/20">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Total Bantuan Tersalurkan</p>
                    <p className="text-2xl font-bold">{formatRupiah(totalAidAmount)}</p>
                  </CardContent>
                </Card>
              </div>

              <form onSubmit={handleAidSubmit} className="space-y-4 rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm">Pemberian Bantuan Baru</h3>
                  <p className="text-xs text-muted-foreground">Pilih penerima aktif yang terdaftar di rumah ibadah ini</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Penerima</Label>
                    <Select
                      value={String(aidForm.recipientId)}
                      onValueChange={(value) => setAidForm((current) => ({ ...current, recipientId: parseInt(value) || 0 }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Pilih penerima aktif" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeRecipients.map((recipient) => (
                          <SelectItem key={recipient.id} value={String(recipient.id)}>
                            {recipient.name} - {recipient.phone || "-"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Jenis Bantuan</Label>
                    <Input
                      value={aidForm.aidType}
                      onChange={(e) => setAidForm((current) => ({ ...current, aidType: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Jumlah (Rp)</Label>
                    <Input
                      value={formatRupiah(aidForm.amount)}
                      onChange={(e) => setAidForm((current) => ({ ...current, amount: parseRupiahInput(e.target.value) }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={aidForm.quantity}
                      onChange={(e) => setAidForm((current) => ({ ...current, quantity: parseInt(e.target.value) || 1 }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Satuan</Label>
                    <Input
                      value={aidForm.unit}
                      onChange={(e) => setAidForm((current) => ({ ...current, unit: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                </div>
                 <div className="space-y-1.5">
                  <Label className="text-xs">Catatan</Label>
                  <Input
                    value={aidForm.notes}
                    onChange={(e) => setAidForm((current) => ({ ...current, notes: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <DocumentUploadField
                    label="Foto Penyerahan Bantuan"
                    value={aidForm.handoverPhoto}
                    onChange={(value) => setAidForm((current) => ({ ...current, handoverPhoto: value ?? "" }))}
                    required={true}
                    helperText="Wajib menampakkan wajah penerima bantuan saat penyerahan"
                    accept="image/*"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createAidMutation.isPending || !aidForm.recipientId || !aidForm.handoverPhoto}>
                  {createAidMutation.isPending ? "Menyimpan bantuan..." : "Simpan Bantuan"}
                </Button>
              </form>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">History Pemberian Bantuan</h3>
                {selectedPlaceDistributions.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground rounded-2xl border">
                    Belum ada history bantuan di rumah ibadah ini
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Tanggal</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Penerima</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Jenis</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Jumlah</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Catatan</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Foto Bukti</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPlaceDistributions.map((distribution) => {
                          const recipientName = selectedPlaceRecipients.find((recipient) => recipient.id === distribution.recipientId)?.name ?? "-";
                          return (
                            <tr key={distribution.id} className="border-b last:border-0">
                              <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(distribution.distributionDate).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="py-3 px-3 text-xs">{recipientName}</td>
                              <td className="py-3 px-3 text-xs">{distribution.aidType}</td>
                              <td className="py-3 px-3 text-xs">{formatRupiah(Number.parseFloat(String(distribution.amount ?? 0)))}</td>
                              <td className="py-3 px-3 text-xs text-muted-foreground">{distribution.notes ?? "-"}</td>
                              <td className="py-3 px-3 text-xs">
                                {distribution.handoverPhoto ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <img
                                        src={distribution.handoverPhoto}
                                        alt="Bukti Penyerahan"
                                        className="h-8 w-12 object-cover rounded cursor-pointer border hover:opacity-80 transition-opacity"
                                      />
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                      <DialogHeader>
                                        <DialogTitle>Foto Penyerahan Bantuan</DialogTitle>
                                      </DialogHeader>
                                      <img
                                        src={distribution.handoverPhoto}
                                        alt="Bukti Penyerahan"
                                        className="w-full max-h-[70vh] object-contain rounded-lg border bg-white"
                                      />
                                    </DialogContent>
                                  </Dialog>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Rumah Ibadah</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Tempat Ibadah</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Tulis nama rumah ibadah" className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipe</Label>
                <Select value={formData.type} onValueChange={(v: typeof formData.type) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mosque">Masjid</SelectItem>
                    <SelectItem value="church">Gereja</SelectItem>
                    <SelectItem value="temple">Pura</SelectItem>
                    <SelectItem value="vihara">Vihara</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Kapasitas</Label>
                <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Alamat</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-9" />
            </div>
            <LocationPicker
              value={formData}
              onChange={updateFormData}
              label="Pilih lokasi rumah ibadah"
              hint="Klik peta atau geser pin. Koordinat dan alamat akan terisi otomatis."
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Latitude</Label><Input value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Longitude</Label><Input value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="h-9" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Radius (m)</Label><Input type="number" value={formData.radius} onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) || 1000 })} className="h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs">No. Kontak</Label><Input value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} className="h-9" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Nama Kontak</Label><Input value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} className="h-9" /></div>
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Memperbarui..." : "Perbarui"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detail Rumah Ibadah</DialogTitle></DialogHeader>
          {selectedPlaceData && (
            <div className="space-y-3 text-sm">
              <Badge className="text-xs">{TYPE_LABELS[selectedPlaceData.type]}</Badge>
              <h3 className="font-semibold text-lg">{selectedPlaceData.name}</h3>
              <div className="space-y-2 text-xs">
                {selectedPlaceData.address && <p className="text-muted-foreground">{selectedPlaceData.address}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Radius:</span> {selectedPlaceData.radius}m</div>
                  <div><span className="text-muted-foreground">Kapasitas:</span> {selectedPlaceData.capacity} orang</div>
                  <div><span className="text-muted-foreground">Lat:</span> {selectedPlaceData.latitude}</div>
                  <div><span className="text-muted-foreground">Lng:</span> {selectedPlaceData.longitude}</div>
                </div>
                {selectedPlaceData.contactName && <p><span className="text-muted-foreground">Kontak:</span> {selectedPlaceData.contactName}</p>}
                {selectedPlaceData.contactPhone && <p><span className="text-muted-foreground">Telepon:</span> {selectedPlaceData.contactPhone}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
