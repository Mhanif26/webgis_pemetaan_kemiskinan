import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, User, UserCog, Crown } from "lucide-react";

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: Crown,
  officer: UserCog,
  manager: User,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700",
  officer: "bg-blue-100 text-blue-700",
  manager: "bg-slate-100 text-slate-700",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  officer: "Petugas Verifikasi",
  manager: "Pengelola",
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  // For now, display current user info. In a full app, we'd have a users.list endpoint
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Kelola pengguna sistem dan peran aksesnya
        </p>
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
                      {role === "admin" && "Akses penuh ke seluruh sistem"}
                      {role === "officer" && "Verifikasi dan setujui pendaftaran warga"}
                      {role === "manager" && "Mendaftarkan warga dan mengelola distribusi"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current User */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Informasi Pengguna Saat Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!currentUser ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-muted/30 rounded-xl">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                {currentUser.name?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{currentUser.name ?? "User"}</h3>
                  <Badge className={`text-[10px] capitalize ${ROLE_COLORS[currentUser.role ?? "manager"]}`}>
                    {ROLE_LABELS[currentUser.role ?? "manager"]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{currentUser.email ?? "-"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Login terakhir: {currentUser.lastSignInAt ? new Date(currentUser.lastSignInAt).toLocaleDateString("id-ID") : "-"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Matriks Izin Akses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Fitur</th>
                  <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Admin</th>
                  <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Petugas</th>
                  <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Pengelola</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Dashboard", admin: true, officer: true, manager: true },
                  { feature: "Peta GIS", admin: true, officer: true, manager: true },
                  { feature: "Penerima Bantuan (CRUD)", admin: true, officer: "R", manager: true },
                  { feature: "Rumah Ibadah (CRUD)", admin: true, officer: "R", manager: "R" },
                  { feature: "Verifikasi Penerima", admin: true, officer: true, manager: false },
                  { feature: "Distribusi Bantuan", admin: true, officer: true, manager: true },
                  { feature: "Manajemen Pengguna", admin: true, officer: false, manager: false },
                  { feature: "Pengaturan Sistem", admin: true, officer: false, manager: false },
                ].map((row) => (
                  <tr key={row.feature} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-3 text-xs font-medium">{row.feature}</td>
                    <td className="py-3 px-3 text-center">
                      {row.admin === true ? (
                        <span className="text-emerald-600 text-xs">Full</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.officer === true ? (
                        <span className="text-emerald-600 text-xs">Full</span>
                      ) : row.officer === "R" ? (
                        <span className="text-blue-600 text-xs">Read</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.manager === true ? (
                        <span className="text-emerald-600 text-xs">Full</span>
                      ) : row.manager === "R" ? (
                        <span className="text-blue-600 text-xs">Read</span>
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
    </div>
  );
}
