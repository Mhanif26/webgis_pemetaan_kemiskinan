import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield,
  User,
  UserCog,
  Crown,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  KeyRound,
  Mail,
  UserCircle,
} from "lucide-react";

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: Crown,
  officer: UserCog,
  manager: User,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700 hover:bg-violet-200",
  officer: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  manager: "bg-slate-100 text-slate-700 hover:bg-slate-200",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  officer: "Petugas Verifikasi",
  manager: "Pengelola",
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null); // null = Add New
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "officer" | "manager">("manager");
  const [selectedPlaces, setSelectedPlaces] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // tRPC Queries & Mutations
  const { data: users, isLoading, refetch } = trpc.user.list.useQuery(undefined, {
    enabled: !!currentUser && currentUser.role === "admin",
  });

  const { data: places, isLoading: placesLoading } = trpc.placeOfWorship.list.useQuery();

  const createUserMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      toast.success("Pengguna baru berhasil ditambahkan!");
      setIsFormOpen(false);
      refetch();
      resetForm();
    },
    onError: (err) => {
      setErrorMsg(err.message || "Gagal menambahkan pengguna.");
    },
  });

  const updateUserMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      toast.success("Data pengguna berhasil diperbarui!");
      setIsFormOpen(false);
      refetch();
      resetForm();
    },
    onError: (err) => {
      setErrorMsg(err.message || "Gagal memperbarui data pengguna.");
    },
  });

  const deleteUserMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      toast.success("Pengguna berhasil dihapus.");
      setIsDeleteOpen(false);
      setUserToDelete(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Gagal menghapus pengguna.");
      setIsDeleteOpen(false);
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("manager");
    setSelectedPlaces([]);
    setErrorMsg("");
    setSelectedUser(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    resetForm();
    setSelectedUser(user);
    setName(user.name || "");
    setEmail(user.email || "");
    setPassword(""); // Biarkan kosong kecuali ingin merubah sandi
    setRole(user.role);
    
    // Ambil list ID rumah ibadah yang sedang dikelola oleh pengguna ini
    const managed = (places ?? [])
      .filter((p) => p.managerId === user.id)
      .map((p) => p.id);
    setSelectedPlaces(managed);
    
    setIsFormOpen(true);
  };

  const handleOpenDelete = (user: any) => {
    setUserToDelete(user);
    setIsDeleteOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Nama harus diisi.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Email tidak valid.");
      return;
    }

    if (role === "manager" && selectedPlaces.length === 0) {
      setErrorMsg("Harap pilih minimal satu rumah ibadah yang dikelola.");
      return;
    }

    if (selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        name,
        email,
        password: password ? password : undefined,
        role,
        placeIds: role === "manager" ? selectedPlaces : undefined,
      });
    } else {
      if (!password || password.length < 6) {
        setErrorMsg("Sandi harus diisi minimal 6 karakter.");
        return;
      }
      createUserMutation.mutate({
        name,
        email,
        password,
        role,
        placeIds: role === "manager" ? selectedPlaces : undefined,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUserMutation.mutate({ id: userToDelete.id });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const isPending = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola pengguna sistem, peran hak akses, dan detail akun petugas/pengelola.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="h-9 text-xs rounded-xl flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Role Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const Icon = ROLE_ICONS[role];
          return (
            <Card key={role} className="rounded-2xl shadow-sm border-0">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${ROLE_COLORS[role].split(" ")[0]}`}>
                    <Icon className={`h-5 w-5 ${ROLE_COLORS[role].split(" ")[1]}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {role === "admin" && "Akses penuh untuk konfigurasi pengguna, sistem, dan rumah ibadah."}
                      {role === "officer" && "Verifikasi kelayakan berkas KTP, KK, SKTM penerima bantuan sosial."}
                      {role === "manager" && "Menginput calon penerima dan mencatat riwayat pembagian bantuan."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main User List Section */}
      <Card className="rounded-2xl shadow-sm border-0 overflow-hidden">
        <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Daftar Pengguna Aktif
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-xs rounded-xl bg-background border-muted"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Tidak ada pengguna yang ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/5 text-left text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Nama</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Peran</th>
                    <th className="py-3 px-4">Terakhir Masuk</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const RoleIcon = ROLE_ICONS[u.role] || User;
                    const isSelf = !!(currentUser && currentUser.id === u.id);
                    return (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-4 font-medium flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">
                                Anda
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`text-[10px] gap-1 rounded-lg border-0 font-medium ${ROLE_COLORS[u.role]}`}>
                            <RoleIcon className="h-3 w-3" />
                            {ROLE_LABELS[u.role]}
                          </Badge>
                          {u.role === "manager" && (
                            <div className="text-[10px] text-muted-foreground mt-1 max-w-xs truncate">
                              Mengelola:{" "}
                              {(places ?? [])
                                .filter((p) => p.managerId === u.id)
                                .map((p) => p.name)
                                .join(", ") || "-"}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {u.lastSignInAt
                            ? new Date(u.lastSignInAt).toLocaleString("id-ID", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(u)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSelf}
                            onClick={() => handleOpenDelete(u)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Table (Access Matrix) */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Matriks Izin Akses Sistem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold text-muted-foreground">
                  <th className="py-3 px-3">Fitur</th>
                  <th className="text-center py-3 px-3">Admin</th>
                  <th className="text-center py-3 px-3">Petugas</th>
                  <th className="text-center py-3 px-3">Pengelola</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Dashboard Utama", admin: true, officer: true, manager: true },
                  { feature: "Visualisasi Peta GIS", admin: true, officer: true, manager: true },
                  { feature: "Data Penerima Bantuan (CRUD)", admin: true, officer: "R", manager: true },
                  { feature: "Data Rumah Ibadah (CRUD)", admin: true, officer: "R", manager: "R" },
                  { feature: "Pencatatan Distribusi Bantuan", admin: true, officer: true, manager: true },
                  { feature: "Verifikasi Kelayakan Dokumen", admin: true, officer: true, manager: false },
                  { feature: "Manajemen Pengguna (CRUD)", admin: true, officer: false, manager: false },
                  { feature: "Pengaturan Sistem", admin: true, officer: false, manager: false },
                ].map((row) => (
                  <tr key={row.feature} className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                    <td className="py-2.5 px-3 text-xs font-medium">{row.feature}</td>
                    <td className="py-2.5 px-3 text-center">
                      {row.admin === true ? (
                        <span className="text-emerald-600 font-semibold text-xs">Full</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.officer === true ? (
                        <span className="text-emerald-600 font-semibold text-xs">Full</span>
                      ) : row.officer === "R" ? (
                        <span className="text-blue-600 font-semibold text-xs">Lihat</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.manager === true ? (
                        <span className="text-emerald-600 font-semibold text-xs">Full</span>
                      ) : row.manager === "R" ? (
                        <span className="text-blue-600 font-semibold text-xs">Lihat</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog: Add/Edit User */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {selectedUser ? "Ubah Data Pengguna" : "Tambah Pengguna Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedUser
                ? "Ubah data akun pengguna di bawah ini. Kosongkan sandi jika tidak ingin dirubah."
                : "Masukkan nama, email, sandi, serta hak akses untuk akun pengguna baru."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {errorMsg && (
              <div className="p-3 text-xs rounded-xl bg-red-50 text-red-600 font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                Nama Lengkap
              </Label>
              <Input
                placeholder="cth: Bapak Sulaiman"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Alamat Email
              </Label>
              <Input
                type="email"
                placeholder="cth: user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                Kata Sandi
              </Label>
              <Input
                type="password"
                placeholder={selectedUser ? "•••••• (kosongkan jika tidak ingin dirubah)" : "Min. 6 karakter"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Peran Hak Akses
              </Label>
              <Select value={role} onValueChange={(val: any) => setRole(val)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Pilih Peran" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="admin" className="text-xs">Administrator</SelectItem>
                  <SelectItem value="officer" className="text-xs">Petugas Verifikasi (Officer)</SelectItem>
                  <SelectItem value="manager" className="text-xs">Pengelola Rumah Ibadah (Manager)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === "manager" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Rumah Ibadah yang Dikelola (Bisa lebih dari satu)</Label>
                <div className="border rounded-xl p-3 max-h-40 overflow-y-auto space-y-2 bg-background">
                  {placesLoading ? (
                    <div className="space-y-1 text-xs text-muted-foreground">Memuat data...</div>
                  ) : !places || places.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Belum ada data rumah ibadah.</div>
                  ) : (
                    places.map((place) => (
                      <label key={place.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded-lg transition-colors">
                        <Checkbox
                          checked={selectedPlaces.includes(place.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPlaces([...selectedPlaces, place.id]);
                            } else {
                              setSelectedPlaces(selectedPlaces.filter((id) => id !== place.id));
                            }
                          }}
                        />
                        <span>
                          {place.name} <span className="text-[10px] text-muted-foreground capitalize">({place.type})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="pt-3 gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-9 text-xs rounded-xl">
                  Batal
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending} className="h-9 text-xs rounded-xl flex items-center gap-1.5">
                {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                {selectedUser ? "Simpan Perubahan" : "Buat Akun"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-red-600">
              Konfirmasi Penghapusan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus akun <strong>{userToDelete?.name}</strong> ({userToDelete?.email})? Tindakan ini bersifat permanen dan tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline" className="h-9 text-xs rounded-xl">
                Batal
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteUserMutation.isPending}
              className="h-9 text-xs rounded-xl flex items-center gap-1.5"
            >
              {deleteUserMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Hapus Akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
