import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DocumentUploadField } from "@/components/DocumentUploadField";
import { useAuth } from "@/hooks/useAuth";
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  MapPin,
  DollarSign,
  Users,
  Clock,
} from "lucide-react";

export default function VerificationPage() {
  const { user } = useAuth();
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: pendingRecipients, isLoading } = trpc.recipient.pending.useQuery();
  const { data: allRecipients } = trpc.recipient.list.useQuery({});
  const { data: places } = trpc.placeOfWorship.list.useQuery({});

  const verifyMutation = trpc.recipient.verify.useMutation({
    onSuccess: () => {
      utils.recipient.pending.invalidate();
      utils.recipient.list.invalidate();
      utils.dashboard.stats.invalidate();
      setSelectedRecipient(null);
    },
  });

  const handleApprove = (id: number) => {
    if (!user?.id) return;
    verifyMutation.mutate({
      id,
      status: "active",
      verifiedBy: user.id,
    });
  };

  const handleReject = () => {
    if (!selectedRecipient || !user?.id) return;
    verifyMutation.mutate({
      id: selectedRecipient,
      status: "rejected",
      verifiedBy: user.id,
      rejectionReason: rejectReason || undefined,
    });
    setIsRejectOpen(false);
    setRejectReason("");
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-emerald-100 text-emerald-700 text-xs"><CheckCircle className="h-3 w-3 mr-1" />Aktif</Badge>;
      case "pending": return <Badge className="bg-amber-100 text-amber-700 text-xs"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-700 text-xs"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const selectedRec = allRecipients?.find((r) => r.id === selectedRecipient);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Verifikasi Penerima</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Setujui atau tolak pendaftaran warga oleh pengelola rumah ibadah
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRecipients?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Menunggu Verifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allRecipients?.filter((r) => r.status === "active").length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Penerima Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allRecipients?.filter((r) => r.status === "rejected").length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Ditolak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending List */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            Daftar Menunggu Verifikasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (pendingRecipients ?? []).length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
              <p>Tidak ada pendaftaran yang menunggu verifikasi</p>
              <p className="text-xs mt-1">Semua pendaftaran sudah diproses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(pendingRecipients ?? []).map((r) => (
                <div
                  key={r.id}
                  className="border rounded-2xl p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{r.name}</h3>
                        <Badge className="bg-amber-100 text-amber-700 text-[10px]">Menunggu</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>NIK: {r.nik}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {places?.find((p) => p.id === r.placeOfWorshipId)?.name ?? "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{r.familyMembers} keluarga</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>Rp {(r.incomePerMonth ?? 0).toLocaleString()}/bln</span>
                        </div>
                      </div>
                      {r.address && (
                        <p className="text-xs text-muted-foreground">{r.address}</p>
                      )}
                      {r.notes && (
                        <p className="text-xs bg-muted p-2 rounded-lg">{r.notes}</p>
                      )}
                      {(r.ktpDocument || r.kkDocument || r.sktmDocument) && (
                        <div className="space-y-2 pt-2">
                          <p className="text-[11px] font-medium text-muted-foreground">Preview Dokumen</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <DocumentUploadField label="KTP" value={r.ktpDocument} />
                            <DocumentUploadField label="KK" value={r.kkDocument} />
                            <DocumentUploadField label="SKTM" value={r.sktmDocument} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs h-8"
                        onClick={() => handleApprove(r.id)}
                        disabled={verifyMutation.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Setuju
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg text-xs h-8"
                        onClick={() => { setSelectedRecipient(r.id); setIsRejectOpen(true); }}
                        disabled={verifyMutation.isPending}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Tolak
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Recipients Status */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Status Semua Pendaftar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(allRecipients ?? []).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Belum ada data</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">Nama</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">NIK</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs">Rumah Ibadah</th>
                  </tr>
                </thead>
                <tbody>
                  {(allRecipients ?? []).slice(0, 20).map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-2 text-xs font-medium">{r.name}</td>
                      <td className="py-3 px-2 text-xs font-mono">{r.nik}</td>
                      <td className="py-3 px-2">{statusBadge(r.status)}</td>
                      <td className="py-3 px-2 text-xs text-muted-foreground">
                        {places?.find((p) => p.id === r.placeOfWorshipId)?.name ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tolak Pendaftaran</DialogTitle></DialogHeader>
          {selectedRec && (
            <div className="space-y-3">
              <p className="text-sm">
                Menolak pendaftaran <strong>{selectedRec.name}</strong> (NIK: {selectedRec.nik})
              </p>
              <Textarea
                placeholder="Alasan penolakan (opsional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsRejectOpen(false)}>Batal</Button>
                <Button variant="destructive" size="sm" onClick={handleReject} disabled={verifyMutation.isPending}>
                  {verifyMutation.isPending ? "Memproses..." : "Tolak"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
