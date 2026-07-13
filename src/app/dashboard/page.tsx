"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Globe, Award, CheckCircle2, BarChart3, ArrowUpRight, ArrowDownRight, Loader2, AlertTriangle
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart
} from "recharts";
import { supabase } from "@/lib/supabase";
import { getKlasifikasiColor } from "@/lib/scoring-engine";
import type { Klasifikasi } from "@/lib/types";

const aspekColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const activePeriodeId = searchParams.get("periode");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      let pId = activePeriodeId;
      if (!pId) {
        // Fetch active periode
        const { data } = await supabase.from("master_periode").select("id").eq("status_aktif", true).single();
        if (data) pId = data.id;
      }
      if (pId) {
        fetchDashboardData(pId);
      } else {
        setLoading(false); // No active period found
      }
    }
    init();
  }, [activePeriodeId]);

  async function fetchDashboardData(periodeId: string) {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Desa counts
      const [desaCountRes, activeDesaCountRes] = await Promise.all([
        supabase.from("desa").select("id", { count: "exact", head: true }),
        supabase.from("desa").select("id", { count: "exact", head: true }).eq("status_aktif", true)
      ]);

      const totalDesa = desaCountRes.count || 0;
      const websiteAktif = activeDesaCountRes.count || 0;
      const websiteTidakAktif = totalDesa - websiteAktif;

      // 2. Fetch Hasil Evaluasi for selected period
      const { data: hasilData, error: hErr } = await supabase
        .from("hasil_evaluasi")
        .select("*, desa(kecamatan_id, kecamatan(nama_kecamatan))")
        .eq("periode_id", periodeId);

      if (hErr) throw hErr;

      const desaDinilai = hasilData?.length || 0;
      const desaBelumDinilai = Math.max(0, totalDesa - desaDinilai);

      // Average score
      const totalSkorVal = hasilData?.reduce((sum, h) => sum + Number(h.total_skor), 0) || 0;
      const rataRataSkor = desaDinilai > 0 ? Math.round((totalSkorVal / desaDinilai) * 10) / 10 : 0;

      // Classification Distribution
      const distribusi: Record<Klasifikasi, number> = {
        "Sangat Aktif": 0,
        "Aktif": 0,
        "Cukup Aktif": 0,
        "Kurang Aktif": 0,
        "Tidak Aktif": 0,
      };
      hasilData?.forEach((h) => {
        if (distribusi[h.klasifikasi as Klasifikasi] !== undefined) {
          distribusi[h.klasifikasi as Klasifikasi]++;
        }
      });

      const pieData = Object.entries(distribusi).map(([name, value]) => ({
        name,
        value,
        color: getKlasifikasiColor(name as Klasifikasi),
      }));

      // 3. Kecamatan Ranking (Group by Kecamatan)
      const kecScores: Record<string, { nama: string; total: number; count: number }> = {};
      hasilData?.forEach((h) => {
        const kecId = h.desa?.kecamatan_id;
        const kecNama = h.desa?.kecamatan?.nama_kecamatan;
        if (!kecId || !kecNama) return;
        if (!kecScores[kecId]) {
          kecScores[kecId] = { nama: kecNama, total: 0, count: 0 };
        }
        kecScores[kecId].total += Number(h.total_skor);
        kecScores[kecId].count++;
      });

      const kecRanking = Object.values(kecScores)
        .map((k) => ({
          nama: k.nama,
          skor: Math.round((k.total / k.count) * 10) / 10,
        }))
        .sort((a, b) => b.skor - a.skor);

      const topKecamatan = kecRanking.slice(0, 5);
      const bottomKecamatan = [...kecRanking].reverse().slice(0, 5);

      // 4. Trend across non-draft periods
      const { data: periodes, error: pErr } = await supabase
        .from("periode_evaluasi")
        .select("id, nama_periode")
        .neq("status", "draft")
        .order("tanggal_mulai", { ascending: true });

      if (pErr) throw pErr;

      const trendDataPromises = (periodes || []).map(async (p) => {
        const { data: evals } = await supabase
          .from("hasil_evaluasi")
          .select("total_skor")
          .eq("periode_id", p.id);
        
        const count = evals?.length || 0;
        const sum = evals?.reduce((s, e) => s + Number(e.total_skor), 0) || 0;
        const avg = count > 0 ? sum / count : 0;
        return {
          periode: p.nama_periode,
          skor: Math.round(avg * 10) / 10
        };
      });

      const trendData = await Promise.all(trendDataPromises);

      setStats({
        totalDesa,
        websiteAktif,
        websiteTidakAktif,
        rataRataSkor,
        desaDinilai,
        desaBelumDinilai,
        pieData,
        topKecamatan,
        bottomKecamatan,
        trendData
      });

    } catch (err: any) {
      console.error("Dashboard error:", err);
      setError("Gagal memuat data statistik dashboard.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--muted-foreground)" }}>
        <Loader2 className="animate-spin" size={32} style={{ marginBottom: 12 }} />
        <p>Memuat statistik monitoring...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
        <AlertTriangle size={36} style={{ margin: "0 auto", marginBottom: 12 }} />
        <p>{error || "Koneksi database terputus."}</p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => fetchDashboardData(activePeriodeId || "")}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard Monitoring & Evaluasi</h1>
        <p className="page-subtitle">
          Ringkasan pemanfaatan OpenSID dan website desa — Kabupaten Bandung
        </p>
      </div>

      {/* Stat Cards */}
      <div
        className="stagger-children"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<Globe size={22} />}
          iconBg="linear-gradient(135deg, #3b82f6, #1e40af)"
          value={stats.totalDesa}
          label="Total Desa/Kelurahan"
          sub={`${stats.websiteAktif} website aktif`}
          subColor="#10b981"
        />
        <StatCard
          icon={<CheckCircle2 size={22} />}
          iconBg="linear-gradient(135deg, #10b981, #059669)"
          value={`${stats.totalDesa > 0 ? Math.round((stats.websiteAktif / stats.totalDesa) * 100) : 0}%`}
          label="Persentase Website Aktif"
          sub={`${stats.websiteTidakAktif} tidak aktif`}
          subColor="#ef4444"
        />
        <StatCard
          icon={<Award size={22} />}
          iconBg="linear-gradient(135deg, #f59e0b, #d97706)"
          value={stats.rataRataSkor}
          label="Rata-rata Skor"
          sub="skala maksimal 100"
          subColor="#64748b"
        />
        <StatCard
          icon={<BarChart3 size={22} />}
          iconBg="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          value={stats.desaDinilai}
          label="Desa Telah Dinilai"
          sub={`${stats.desaBelumDinilai} belum dinilai`}
          subColor="#f59e0b"
        />
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Distribution Pie */}
        <div className="card animate-fade-in">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Distribusi Klasifikasi
          </h3>
          {stats.desaDinilai > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {stats.pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {stats.pieData.map((item: any) => (
                  <div
                    key={item.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: item.color,
                        }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--muted-foreground)" }}>
              Belum ada hasil penilaian untuk dirangkum.
            </div>
          )}
        </div>

        {/* Trend Chart */}
        <div className="card animate-fade-in">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Tren Rata-rata Skor per Periode
          </h3>
          {stats.trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.trendData}>
                <defs>
                  <linearGradient id="colorSkor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="periode"
                  fontSize={11}
                  tick={{ fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => v.replace("Triwulan ", "TW ")}
                />
                <YAxis
                  domain={[0, 100]}
                  fontSize={11}
                  tick={{ fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="skor"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#colorSkor)"
                  name="Rata-rata Skor"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--muted-foreground)" }}>
              Belum ada data tren yang terekam.
            </div>
          )}
        </div>
      </div>

      {/* Ranking Tables Row */}
      {stats.desaDinilai > 0 && stats.topKecamatan.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {/* Top 5 */}
          <div className="card animate-fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>
                🏆 Kecamatan Teratas
              </h3>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Top 5</span>
            </div>
            {stats.topKecamatan.map((kec: any, i: number) => (
              <div
                key={kec.nama}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: i < stats.topKecamatan.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background:
                        i === 0
                          ? "linear-gradient(135deg, #fbbf24, #d97706)"
                          : i === 1
                          ? "linear-gradient(135deg, #d1d5db, #9ca3af)"
                          : i === 2
                          ? "linear-gradient(135deg, #d97706, #92400e)"
                          : "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: i < 3 ? "#fff" : "var(--muted-foreground)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>Kec. {kec.nama}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#10b981" }}>
                    {kec.skor}
                  </span>
                  <ArrowUpRight size={14} color="#10b981" />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom 5 */}
          <div className="card animate-fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>
                ⚠️ Kecamatan Perlu Perhatian
              </h3>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Bottom 5</span>
            </div>
            {stats.bottomKecamatan.map((kec: any, i: number) => (
              <div
                key={kec.nama}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: i < stats.bottomKecamatan.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "rgba(239, 68, 68, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#ef4444",
                    }}
                  >
                    {i + 1}
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>Kec. {kec.nama}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#ef4444" }}>
                    {kec.skor}
                  </span>
                  <ArrowDownRight size={14} color="#ef4444" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      {stats.desaDinilai > 0 && stats.topKecamatan.length > 0 && (
        <div className="card animate-fade-in" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Perbandingan Skor Rata-rata per Kecamatan
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.topKecamatan.concat(stats.bottomKecamatan.reverse()).slice(0, 10)} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="nama"
                fontSize={11}
                tick={{ fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `Kec. ${v}`}
              />
              <YAxis domain={[0, 100]} fontSize={11} tick={{ fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="skor" name="Rata-rata Skor" radius={[6, 6, 0, 0]}>
                {stats.topKecamatan
                  .concat(stats.bottomKecamatan.reverse())
                  .slice(0, 10)
                  .map((entry: any, index: number) => (
                    <Cell
                      key={index}
                      fill={
                        entry.skor >= 85
                          ? "#10b981"
                          : entry.skor >= 70
                          ? "#3b82f6"
                          : entry.skor >= 55
                          ? "#f59e0b"
                          : entry.skor >= 40
                          ? "#f97316"
                          : "#ef4444"
                      }
                    />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ---- Stat Card sub-component ----
function StatCard({
  icon,
  iconBg,
  value,
  label,
  sub,
  subColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string | number;
  label: string;
  sub: string;
  subColor: string;
}) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="stat-icon" style={{ background: iconBg, color: "#fff" }}>
        {icon}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        <div style={{ fontSize: 12, color: subColor, marginTop: 4, fontWeight: 500 }}>
          {sub}
        </div>
      </div>
    </div>
  );
}
