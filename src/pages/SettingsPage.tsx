import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  User,
  Database,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [showRadiusDefault, setShowRadiusDefault] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const seedMutation = trpc.seed.run.useMutation({
    onSuccess: (data) => {
      setSeedResult(data.message);
      setTimeout(() => setSeedResult(null), 5000);
    },
  });

  const ROLE_LABELS: Record<string, string> = {
    admin: "Administrator",
    officer: "Petugas Verifikasi",
    manager: "Pengelola",
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pengaturan</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Kelola preferensi dan pengaturan sistem
        </p>
      </div>

      {/* Profile */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Profil Pengguna
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div>
              <h3 className="font-semibold">{user?.name ?? "User"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email ?? "-"}</p>
              <Badge variant="secondary" className="mt-1 text-[10px] capitalize">
                {ROLE_LABELS[user?.role ?? "manager"]}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Settings */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            Pengaturan Peta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Tampilkan Radius Default</Label>
              <p className="text-xs text-muted-foreground">
                Selalu tampilkan lingkaran radius cakupan rumah ibadah
              </p>
            </div>
            <Switch checked={showRadiusDefault} onCheckedChange={setShowRadiusDefault} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Mode Gelap</Label>
              <p className="text-xs text-muted-foreground">
                Gunakan tema gelap untuk seluruh aplikasi
              </p>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            Manajemen Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {seedResult && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {seedResult}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Isi Data Awal</Label>
              <p className="text-xs text-muted-foreground">
                Isi database dengan data sampel untuk demo
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="rounded-lg text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              {seedMutation.isPending ? "Mengisi..." : "Seed Data"}
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm text-destructive">Reset Data</Label>
              <p className="text-xs text-muted-foreground">
                Hapus semua data dan mulai dari awal
              </p>
            </div>
            <Button size="sm" variant="destructive" className="rounded-lg text-xs" disabled>
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardContent className="p-5">
          <div className="text-center space-y-2">
            <h3 className="font-semibold">WebGIS Poverty Mapping</h3>
            <p className="text-xs text-muted-foreground">
              Sistem Pemetaan Kemiskinan Berbasis Web dengan Partisipasi Rumah Ibadah
            </p>
            <p className="text-xs text-muted-foreground">Versi 1.0.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
