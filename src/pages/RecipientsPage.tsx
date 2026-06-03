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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "pending", label: "Menunggu" },
  { value: "rejected", label: "Ditolak" },
  { value: "suspended", label: "Ditangguhkan" },
];

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

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

export default function RecipientsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const canModify = isAdmin || isManager;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nik: "",
    name: "",
    birthDate: "",
    gender: "male" as "male" | "female",
    address: "",
    phone: "",
    familyMembers: 1,
    incomePerMonth: 0,
    placeOfWorshipId: 0,
    notes: "",
    latitude: "",
    longitude: "",
    ktpDocument: "",
    kkDocument: "",
    sktmDocument: "",
  });

  const utils = trpc.useUtils();
  const { data: recipients, isLoading } = trpc.recipient.list.useQuery({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const { data: places } = trpc.placeOfWorship.list.useQuery({});

  const placesWithCoordinates = useMemo(() => {
    return (places ?? [])
      .map((place) => {
        const latitude = Number.parseFloat(String(place.latitude));
        const longitude = Number.parseFloat(String(place.longitude));
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }
        return {
          id: place.id,
          name: place.name,
          latitude,
          longitude,
        };
      })
      .filter((place): place is NonNullable<typeof place> => place !== null);
  }, [places]);

  const createMutation = trpc.recipient.create.useMutation({
    onSuccess: () => {
      utils.recipient.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsAddOpen(false);
      resetForm();
      toast.success("Penerima bantuan baru berhasil didaftarkan!");
    },
    onError: (err) => {
      toast.error(err.message || "Gagal mendaftarkan penerima bantuan baru.");
    },
  });

  const updateMutation = trpc.recipient.update.useMutation({
    onSuccess: () => {
      utils.recipient.list.invalidate();
      setIsEditOpen(false);
      resetForm();
      toast.success("Data penerima bantuan berhasil diperbarui!");
    },
    onError: (err) => {
      toast.error(err.message || "Gagal memperbarui data penerima.");
    },
  });

  const deleteMutation = trpc.recipient.delete.useMutation({
    onSuccess: () => {
      utils.recipient.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Penerima bantuan berhasil dihapus.");
    },
    onError: (err) => {
      toast.error(err.message || "Gagal menghapus data penerima.");
    },
  });

  const resetForm = () => {
    setFormData({
      nik: "",
      name: "",
      birthDate: "",
      gender: "male",
      address: "",
      phone: "",
      familyMembers: 1,
      incomePerMonth: 0,
      placeOfWorshipId: 0,
      notes: "",
      latitude: "",
      longitude: "",
      ktpDocument: "",
      kkDocument: "",
      sktmDocument: "",
    });
    setSelectedRecipient(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedPlaceOfWorshipId = nearestPlaceForForm?.id ?? formData.placeOfWorshipId;
    
    if (!formData.nik.trim()) {
      toast.error("NIK harus diisi.");
      return;
    }
    if (formData.nik.length !== 16) {
      toast.error("NIK harus berjumlah tepat 16 digit.");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Nama Lengkap harus diisi.");
      return;
    }
    if (!resolvedPlaceOfWorshipId) {
      toast.error("Gagal menentukan Rumah Ibadah terdekat. Harap klik peta untuk memplot koordinat lokasi.");
      return;
    }
    if (!formData.ktpDocument) {
      toast.error("Foto KTP wajib diunggah.");
      return;
    }
    if (!formData.kkDocument) {
      toast.error("Foto Kartu Keluarga (KK) wajib diunggah.");
      return;
    }

    createMutation.mutate({
      nik: formData.nik,
      name: formData.name,
      birthDate: formData.birthDate || undefined,
      gender: formData.gender,
      address: formData.address || undefined,
      phone: formData.phone || undefined,
      familyMembers: formData.familyMembers,
      incomePerMonth: formData.incomePerMonth,
      placeOfWorshipId: resolvedPlaceOfWorshipId,
      notes: formData.notes || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      ktpDocument: formData.ktpDocument,
      kkDocument: formData.kkDocument,
      sktmDocument: formData.sktmDocument || undefined,
    });
  };

  const handleEdit = (recipient: NonNullable<typeof recipients>[number]) => {
    setFormData({
      nik: recipient.nik,
      name: recipient.name,
      birthDate: recipient.birthDate ?? "",
      gender: (recipient.gender as "male" | "female") ?? "male",
      address: recipient.address ?? "",
      phone: recipient.phone ?? "",
      familyMembers: recipient.familyMembers ?? 1,
      incomePerMonth: recipient.incomePerMonth ?? 0,
      placeOfWorshipId: recipient.placeOfWorshipId,
      notes: recipient.notes ?? "",
      latitude: recipient.latitude?.toString() ?? "",
      longitude: recipient.longitude?.toString() ?? "",
      ktpDocument: recipient.ktpDocument ?? "",
      kkDocument: recipient.kkDocument ?? "",
      sktmDocument: recipient.sktmDocument ?? "",
    });
    setSelectedRecipient(recipient.id);
    setIsEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedPlaceOfWorshipId = nearestPlaceForForm?.id ?? formData.placeOfWorshipId;
    if (!selectedRecipient) return;

    if (!formData.nik.trim()) {
      toast.error("NIK harus diisi.");
      return;
    }
    if (formData.nik.length !== 16) {
      toast.error("NIK harus berjumlah tepat 16 digit.");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Nama Lengkap harus diisi.");
      return;
    }
    if (!resolvedPlaceOfWorshipId) {
      toast.error("Gagal menentukan Rumah Ibadah terdekat. Harap pilih koordinat lokasi di peta.");
      return;
    }

    updateMutation.mutate({
      id: selectedRecipient,
      nik: formData.nik,
      name: formData.name,
      birthDate: formData.birthDate || undefined,
      gender: formData.gender,
      address: formData.address || undefined,
      phone: formData.phone || undefined,
      familyMembers: formData.familyMembers,
      incomePerMonth: formData.incomePerMonth,
      placeOfWorshipId: resolvedPlaceOfWorshipId,
      notes: formData.notes || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      ktpDocument: formData.ktpDocument || undefined,
      kkDocument: formData.kkDocument || undefined,
      sktmDocument: formData.sktmDocument || undefined,
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 capitalize text-xs"><CheckCircle className="h-3 w-3 mr-1" />Aktif</Badge>;
      case "pending": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 capitalize text-xs"><AlertCircle className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 capitalize text-xs"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      case "suspended": return <Badge variant="secondary" className="capitalize text-xs">Ditangguhkan</Badge>;
      default: return <Badge variant="outline" className="capitalize text-xs">{status}</Badge>;
    }
  };

  const selectedRec = recipients?.find((r) => r.id === selectedRecipient);

  const updateFormData = (next: Partial<typeof formData>) => {
    setFormData((current) => ({ ...current, ...next }));
  };

  const nearestPlaceForForm = (() => {
    const latitude = Number.parseFloat(formData.latitude);
    const longitude = Number.parseFloat(formData.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    let nearest: { id: number; name: string; distanceKm: number } | null = null;
    for (const place of placesWithCoordinates) {
      const distanceKm = haversineDistanceKm(latitude, longitude, place.latitude, place.longitude);
      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = { id: place.id, name: place.name, distanceKm };
      }
    }
    return nearest;
  })();

  const getRecipientDistanceToPlace = (recipient: NonNullable<typeof recipients>[number]) => {
    const latitude = Number.parseFloat(String(recipient.latitude));
    const longitude = Number.parseFloat(String(recipient.longitude));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const place = placesWithCoordinates.find((item) => item.id === recipient.placeOfWorshipId);
    if (!place) {
      return null;
    }
    return haversineDistanceKm(latitude, longitude, place.latitude, place.longitude);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Penerima Bantuan</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola data warga penerima bantuan sosial
          </p>
        </div>
        {canModify && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Penerima
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Penerima Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">NIK</Label>
                    <Input value={formData.nik} onChange={(e) => updateFormData({ nik: e.target.value })} placeholder="16 digit" maxLength={16} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Lengkap</Label>
                    <Input value={formData.name} onChange={(e) => updateFormData({ name: e.target.value })} placeholder="Nama" className="h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tanggal Lahir</Label>
                    <Input type="date" value={formData.birthDate} onChange={(e) => updateFormData({ birthDate: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Jenis Kelamin</Label>
                    <Select value={formData.gender} onValueChange={(v: "male" | "female") => updateFormData({ gender: v })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Laki-laki</SelectItem>
                        <SelectItem value="female">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alamat</Label>
                  <Input value={formData.address} onChange={(e) => updateFormData({ address: e.target.value })} placeholder="Alamat lengkap" className="h-9" />
                </div>
                <LocationPicker
                  value={formData}
                  onChange={updateFormData}
                  label="Pilih titik lokasi dari peta"
                  hint="Klik atau geser pin. Alamat akan terisi otomatis dari koordinat yang dipilih."
                />
                <div className="grid grid-cols-1 gap-3">
                  <DocumentUploadField
                    label="Foto KTP (Kartu Tanda Penduduk)"
                    value={formData.ktpDocument}
                    onChange={(value) => updateFormData({ ktpDocument: value ?? "" })}
                    required
                    helperText="JPG, PNG, PDF - Maks 5MB"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DocumentUploadField
                      label="Foto Kartu Keluarga (KK)"
                      value={formData.kkDocument}
                      onChange={(value) => updateFormData({ kkDocument: value ?? "" })}
                      required
                      helperText="JPG, PNG, PDF"
                    />
                    <DocumentUploadField
                      label="Surat Keterangan Tidak Mampu (SKTM)"
                      value={formData.sktmDocument}
                      onChange={(value) => updateFormData({ sktmDocument: value ?? "" })}
                      helperText="JPG, PNG, PDF (Opsional)"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Telepon</Label>
                    <Input value={formData.phone} onChange={(e) => updateFormData({ phone: e.target.value })} placeholder="08xxxxxxxxxx" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Jumlah Anggota Keluarga</Label>
                    <Input type="number" min={1} value={formData.familyMembers} onChange={(e) => updateFormData({ familyMembers: parseInt(e.target.value) || 1 })} className="h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pendapatan/Bulan (Rp)</Label>
                    <Input
                      value={formatRupiah(formData.incomePerMonth)}
                      onChange={(e) => updateFormData({ incomePerMonth: parseRupiahInput(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Rumah ibadah terdekat (otomatis)</p>
                  <p>
                    {nearestPlaceForForm
                      ? `${nearestPlaceForForm.name} • ${formatDistance(nearestPlaceForForm.distanceKm)}`
                      : "Pilih titik pada peta untuk menentukan rumah ibadah terdekat."}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Catatan</Label>
                  <Input value={formData.notes} onChange={(e) => updateFormData({ notes: e.target.value })} placeholder="Catatan tambahan" className="h-9" />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || !formData.ktpDocument || !formData.kkDocument}
                >
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
              <Input
                placeholder="Cari nama atau NIK..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (recipients ?? []).length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted" />
              <p>Belum ada data penerima</p>
              <p className="text-xs mt-1">Tambahkan penerima baru untuk memulai</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">NIK</TableHead>
                    <TableHead className="text-xs">Nama</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Rumah Ibadah</TableHead>
                    <TableHead className="text-xs">Jarak</TableHead>
                    <TableHead className="text-xs">Keluarga</TableHead>
                    <TableHead className="text-xs">Pendapatan</TableHead>
                    <TableHead className="text-xs">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recipients ?? []).map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono">{r.nik}</TableCell>
                      <TableCell className="text-xs font-medium">{r.name}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs">
                        {places?.find((p) => p.id === r.placeOfWorshipId)?.name ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {(() => {
                          const distanceKm = getRecipientDistanceToPlace(r);
                          return distanceKm === null ? "-" : formatDistance(distanceKm);
                        })()}
                      </TableCell>
                      <TableCell className="text-xs">{r.familyMembers}</TableCell>
                      <TableCell className="text-xs">
                        {formatRupiah(r.incomePerMonth ?? 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setSelectedRecipient(r.id); setIsViewOpen(true); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {canModify && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEdit(r)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => {
                                  if (confirm("Hapus penerima ini?")) {
                                    deleteMutation.mutate({ id: r.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Penerima</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">NIK</Label>
                <Input value={formData.nik} onChange={(e) => updateFormData({ nik: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nama</Label>
                <Input value={formData.name} onChange={(e) => updateFormData({ name: e.target.value })} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tanggal Lahir</Label>
                <Input type="date" value={formData.birthDate} onChange={(e) => updateFormData({ birthDate: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jenis Kelamin</Label>
                <Select value={formData.gender} onValueChange={(v: "male" | "female") => updateFormData({ gender: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Laki-laki</SelectItem>
                    <SelectItem value="female">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Alamat</Label>
              <Input value={formData.address} onChange={(e) => updateFormData({ address: e.target.value })} className="h-9" />
            </div>
            <LocationPicker
              value={formData}
              onChange={updateFormData}
              label="Pilih titik lokasi dari peta"
              hint="Klik atau geser pin. Alamat akan terisi otomatis dari koordinat yang dipilih."
            />
            <div className="grid grid-cols-1 gap-3">
              <DocumentUploadField
                label="Foto KTP (Kartu Tanda Penduduk)"
                value={formData.ktpDocument}
                onChange={(value) => updateFormData({ ktpDocument: value ?? "" })}
                required
                helperText="JPG, PNG, PDF - Maks 5MB"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DocumentUploadField
                  label="Foto Kartu Keluarga (KK)"
                  value={formData.kkDocument}
                  onChange={(value) => updateFormData({ kkDocument: value ?? "" })}
                  required
                  helperText="JPG, PNG, PDF"
                />
                <DocumentUploadField
                  label="Surat Keterangan Tidak Mampu (SKTM)"
                  value={formData.sktmDocument}
                  onChange={(value) => updateFormData({ sktmDocument: value ?? "" })}
                  helperText="JPG, PNG, PDF (Opsional)"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Telepon</Label>
                <Input value={formData.phone} onChange={(e) => updateFormData({ phone: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jumlah Anggota Keluarga</Label>
                <Input type="number" value={formData.familyMembers} onChange={(e) => updateFormData({ familyMembers: parseInt(e.target.value) || 1 })} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Pendapatan/Bulan</Label>
                <Input
                  value={formatRupiah(formData.incomePerMonth)}
                  onChange={(e) => updateFormData({ incomePerMonth: parseRupiahInput(e.target.value) })}
                  className="h-9"
                />
              </div>
            </div>
            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Rumah ibadah terdekat (otomatis)</p>
              <p>
                {nearestPlaceForForm
                  ? `${nearestPlaceForForm.name} • ${formatDistance(nearestPlaceForForm.distanceKm)}`
                  : "Pilih titik pada peta untuk menentukan rumah ibadah terdekat."}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Memperbarui..." : "Perbarui"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detail Penerima</DialogTitle></DialogHeader>
          {selectedRec && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">{selectedRec.name}</span>
                {statusBadge(selectedRec.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">NIK:</span> {selectedRec.nik}</div>
                <div><span className="text-muted-foreground">Telepon:</span> {selectedRec.phone ?? "-"}</div>
                <div><span className="text-muted-foreground">Tgl Lahir:</span> {selectedRec.birthDate ?? "-"}</div>
                <div><span className="text-muted-foreground">JK:</span> {selectedRec.gender === "male" ? "Laki-laki" : "Perempuan"}</div>
                <div><span className="text-muted-foreground">Keluarga:</span> {selectedRec.familyMembers} orang</div>
                <div><span className="text-muted-foreground">Pendapatan:</span> Rp {(selectedRec.incomePerMonth ?? 0).toLocaleString()}</div>
              </div>
              {selectedRec.address && (
                <div className="text-xs"><span className="text-muted-foreground">Alamat:</span> {selectedRec.address}</div>
              )}
              {selectedRec.latitude && selectedRec.longitude && (
                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {selectedRec.latitude}, {selectedRec.longitude}
                </div>
              )}
              {selectedRec.notes && (
                <div className="text-xs bg-muted p-2 rounded-lg"><span className="text-muted-foreground">Catatan:</span> {selectedRec.notes}</div>
              )}
              {(selectedRec.ktpDocument || selectedRec.kkDocument || selectedRec.sktmDocument) && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">Dokumen Terunggah</p>
                  <div className="grid grid-cols-1 gap-3">
                    <DocumentUploadField label="KTP" value={selectedRec.ktpDocument} />
                    <DocumentUploadField label="KK" value={selectedRec.kkDocument} />
                    <DocumentUploadField label="SKTM" value={selectedRec.sktmDocument} />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
