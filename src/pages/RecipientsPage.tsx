import { useState } from "react";
import { trpc } from "@/providers/trpc";
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

export default function RecipientsPage() {
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
    placeOfWorshipId: 1,
    notes: "",
    latitude: "",
    longitude: "",
  });

  const utils = trpc.useUtils();
  const { data: recipients, isLoading } = trpc.recipient.list.useQuery({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const { data: places } = trpc.placeOfWorship.list.useQuery({});

  const createMutation = trpc.recipient.create.useMutation({
    onSuccess: () => {
      utils.recipient.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsAddOpen(false);
      resetForm();
    },
  });

  const updateMutation = trpc.recipient.update.useMutation({
    onSuccess: () => {
      utils.recipient.list.invalidate();
      setIsEditOpen(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.recipient.delete.useMutation({
    onSuccess: () => {
      utils.recipient.list.invalidate();
      utils.dashboard.stats.invalidate();
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
      placeOfWorshipId: 1,
      notes: "",
      latitude: "",
      longitude: "",
    });
    setSelectedRecipient(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nik || !formData.name) return;
    createMutation.mutate({
      nik: formData.nik,
      name: formData.name,
      birthDate: formData.birthDate || undefined,
      gender: formData.gender,
      address: formData.address || undefined,
      phone: formData.phone || undefined,
      familyMembers: formData.familyMembers,
      incomePerMonth: formData.incomePerMonth,
      placeOfWorshipId: formData.placeOfWorshipId,
      notes: formData.notes || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
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
    });
    setSelectedRecipient(recipient.id);
    setIsEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient) return;
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
      placeOfWorshipId: formData.placeOfWorshipId,
      notes: formData.notes || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Penerima Bantuan</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola data warga penerima bantuan sosial
          </p>
        </div>
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
                  <Input value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} placeholder="16 digit" maxLength={16} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Lengkap</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nama" className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanggal Lahir</Label>
                  <Input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Jenis Kelamin</Label>
                  <Select value={formData.gender} onValueChange={(v: "male" | "female") => setFormData({ ...formData, gender: v })}>
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
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Alamat lengkap" className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Telepon</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="08xxxxxxxxxx" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Jumlah Keluarga</Label>
                  <Input type="number" min={1} value={formData.familyMembers} onChange={(e) => setFormData({ ...formData, familyMembers: parseInt(e.target.value) || 1 })} className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Pendapatan/Bulan (Rp)</Label>
                  <Input type="number" min={0} value={formData.incomePerMonth} onChange={(e) => setFormData({ ...formData, incomePerMonth: parseInt(e.target.value) || 0 })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Rumah Ibadah</Label>
                  <Select value={String(formData.placeOfWorshipId)} onValueChange={(v) => setFormData({ ...formData, placeOfWorshipId: parseInt(v) })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(places ?? []).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
              <div className="space-y-1.5">
                <Label className="text-xs">Catatan</Label>
                <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Catatan tambahan" className="h-9" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
                      <TableCell className="text-xs">{r.familyMembers}</TableCell>
                      <TableCell className="text-xs">
                        Rp {(r.incomePerMonth ?? 0).toLocaleString("id-ID")}
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
                <Input value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nama</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tanggal Lahir</Label>
                <Input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jenis Kelamin</Label>
                <Select value={formData.gender} onValueChange={(v: "male" | "female") => setFormData({ ...formData, gender: v })}>
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
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Telepon</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jumlah Keluarga</Label>
                <Input type="number" value={formData.familyMembers} onChange={(e) => setFormData({ ...formData, familyMembers: parseInt(e.target.value) || 1 })} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Pendapatan/Bulan</Label>
                <Input type="number" value={formData.incomePerMonth} onChange={(e) => setFormData({ ...formData, incomePerMonth: parseInt(e.target.value) || 0 })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Rumah Ibadah</Label>
                <Select value={String(formData.placeOfWorshipId)} onValueChange={(v) => setFormData({ ...formData, placeOfWorshipId: parseInt(v) })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(places ?? []).map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Latitude</Label>
                <Input value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Longitude</Label>
                <Input value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="h-9" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Memperbarui..." : "Perbarui"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
