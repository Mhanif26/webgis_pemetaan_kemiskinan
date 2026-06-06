import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  MapPin,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: activities, isLoading: actLoading } =
    trpc.dashboard.activities.useQuery(
      { limit: 10 },
      { enabled: !!user && user.role === "admin" }
    );

  const statCards = [
    {
      title: "Total Penerima",
      value: stats?.totalRecipients ?? 0,
      icon: Users,
      subtitle: `${stats?.activeRecipients ?? 0} aktif`,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Penerima Aktif",
      value: stats?.activeRecipients ?? 0,
      icon: CheckCircle,
      subtitle: `${stats?.pendingRecipients ?? 0} menunggu verifikasi`,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Rumah Ibadah",
      value: stats?.totalPlaces ?? 0,
      icon: MapPin,
      subtitle: `${stats?.activePlaces ?? 0} aktif`,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Distribusi Bantuan",
      value: stats?.totalDistributions ?? 0,
      icon: ClipboardList,
      subtitle: `Rp ${((stats?.totalAidAmount ?? 0) / 1000000).toFixed(1)}M total`,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Ringkasan data pemetaan kemiskinan dan distribusi bantuan
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="rounded-2xl shadow-sm border-0 bg-white dark:bg-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-3xl font-bold">{card.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Distribution Chart */}
        <Card className="rounded-2xl shadow-sm border-0 bg-white dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Distribusi Bulanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (stats?.monthlyDist ?? []).length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                Tidak ada data distribusi
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats?.monthlyDist ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#4f46e5"
                    radius={[6, 6, 0, 0]}
                    name="Jumlah Distribusi"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="rounded-2xl shadow-sm border-0 bg-white dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Status Penerima
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (stats?.byStatus ?? []).length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                Tidak ada data
              </div>
            ) : (
              <div className="flex items-center">
                <ResponsiveContainer width="60%" height={240}>
                  <PieChart>
                    <Pie
                      data={stats?.byStatus ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="status"
                    >
                      {(stats?.byStatus ?? []).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {(stats?.byStatus ?? []).map((item, index) => (
                    <div key={item.status} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm capitalize">{item.status}</span>
                      <span className="text-sm font-semibold ml-auto">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Table */}
      {user?.role === "admin" && (
        <Card className="rounded-2xl shadow-sm border-0 bg-white dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (activities ?? []).length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Belum ada aktivitas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Aksi
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Entitas
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Detail
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Waktu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activities ?? []).map((act) => (
                      <tr
                        key={act.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <Badge
                            variant={
                              act.action === "CREATE"
                                ? "default"
                                : act.action === "VERIFY"
                                ? "secondary"
                                : act.action === "DELETE"
                                ? "destructive"
                                : "outline"
                            }
                            className="text-xs capitalize"
                          >
                            {act.action.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 capitalize text-muted-foreground">
                          {act.entityType.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 px-2 max-w-[300px] truncate">
                          {act.details}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                          {act.createdAt
                            ? new Date(act.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
