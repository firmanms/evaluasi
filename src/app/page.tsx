"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Activity, MapPin, Award, Search, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS: Record<string, string> = {
  "Sangat Aktif": "#10b981",
  "Aktif": "#3b82f6",
  "Cukup Aktif": "#f59e0b",
  "Kurang Aktif": "#f97316",
  "Tidak Aktif": "#ef4444",
};

export default function LandingPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState<any[]>([]);
  const [periodeName, setPeriodeName] = useState("");

  useEffect(() => {
    fetchPublicData();
  }, []);

  async function fetchPublicData() {
    try {
      // Get the active period
      const { data: activePeriod } = await supabase
        .from("periode_evaluasi")
        .select("id, nama_periode")
        .eq("status", "berjalan")
        .maybeSingle();

      if (!activePeriod) {
        setLoading(false);
        return;
      }

      setPeriodeName(activePeriod.nama_periode);

      // Get evaluation results for the active period
      const { data: hasil, error } = await supabase
        .from("hasil_evaluasi")
        .select("*, desa(nama_desa, kecamatan(nama_kecamatan))")
        .eq("periode_id", activePeriod.id)
        .order("total_skor", { ascending: false });

      if (error) throw error;

      const formatted = (hasil || []).map((h) => ({
        id: h.id,
        nama_desa: h.desa?.nama_desa,
        nama_kecamatan: h.desa?.kecamatan?.nama_kecamatan,
        total_skor: h.total_skor,
        klasifikasi: h.klasifikasi
      }));

      setData(formatted);

      // Aggregate for chart
      const counts: Record<string, number> = {
        "Sangat Aktif": 0,
        "Aktif": 0,
        "Cukup Aktif": 0,
        "Kurang Aktif": 0,
        "Tidak Aktif": 0
      };

      formatted.forEach((item) => {
        if (counts[item.klasifikasi] !== undefined) {
          counts[item.klasifikasi]++;
        }
      });

      const chartData = Object.keys(counts)
        .filter(k => counts[k] > 0)
        .map((k) => ({
          name: k,
          value: counts[k]
        }));

      setSummary(chartData);
    } catch (err) {
      console.error("Failed to fetch public data:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredData = data.filter(d =>
    d.nama_desa?.toLowerCase().includes(search.toLowerCase()) ||
    d.nama_kecamatan?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--background)" }}>
        <Loader2 className="animate-spin" size={48} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Navbar Minimalis */}
      <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #3b82f6, #10b981)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={18} color="white" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Monev Web Desa</span>
        </div>
        {/* Tidak ada tombol login eksplisit sesuai permintaan (bisa diakses via url /login) */}
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: "80px 24px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        color: "white",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "-50%", left: "-10%", width: "50%", height: "200%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)" }}></div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "6px 16px", background: "rgba(255,255,255,0.1)", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 24, border: "1px solid rgba(255,255,255,0.2)" }}>
            Portal Data Terbuka
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.2, marginBottom: 24, letterSpacing: "-0.02em" }}>
            Hasil Evaluasi Pemanfaatan <br />
            <span style={{ color: "#34d399" }}>Website Desa & OpenSID</span>
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
            Transparansi penilaian tata kelola digital desa di Kabupaten Bandung. <br />
            Menuju desa cerdas, mandiri, dan terhubung.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>

        {periodeName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <BarChart3 size={24} color="#3b82f6" />
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>Data Evaluasi: {periodeName}</h2>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 60, color: "var(--muted-foreground)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Belum Ada Periode Evaluasi Aktif</h3>
            <p>Data hasil evaluasi akan muncul setelah periode evaluasi dimulai.</p>
          </div>
        )}

        {periodeName && data.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 40 }}>
            {/* Chart Section */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>Sebaran Klasifikasi Desa</h3>
              <div style={{ height: 300, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {summary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#ccc"} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} Desa`, "Jumlah"]}
                      contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 3 Section or Stats summary */}
            <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24, textAlign: "center" }}>Ringkasan Evaluasi</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ padding: 20, background: "rgba(59,130,246,0.05)", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "#3b82f6", marginBottom: 8 }}>{data.length}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--muted-foreground)" }}>Total Desa Dinilai</div>
                </div>
                <div style={{ padding: 20, background: "rgba(16,185,129,0.05)", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "#10b981", marginBottom: 8 }}>
                    {summary.find(s => s.name === "Sangat Aktif")?.value || 0}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--muted-foreground)" }}>Desa Sangat Aktif</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* {periodeName && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Daftar Peringkat Desa</h3>
              <div className="search-box" style={{ maxWidth: 300, width: "100%" }}>
                <Search size={16} />
                <input
                  placeholder="Cari desa atau kecamatan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    <th style={{ width: 80, textAlign: "center", padding: "14px 16px", fontWeight: 600, color: "var(--muted-foreground)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>Peringkat</th>
                    <th style={{ padding: "14px 16px", fontWeight: 600, color: "var(--muted-foreground)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>Nama Desa</th>
                    <th style={{ padding: "14px 16px", fontWeight: 600, color: "var(--muted-foreground)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>Kecamatan</th>
                    <th style={{ padding: "14px 16px", fontWeight: 600, color: "var(--muted-foreground)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Skor Total</th>
                    <th style={{ padding: "14px 16px", fontWeight: 600, color: "var(--muted-foreground)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>Klasifikasi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => {
                      const color = COLORS[item.klasifikasi] || "#6b7280";
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}>
                          <td style={{ textAlign: "center", padding: "14px 16px", fontWeight: 700, color: index < 3 ? "#f59e0b" : "var(--foreground)" }}>
                            #{index + 1}
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: 600 }}>{item.nama_desa}</td>
                          <td style={{ padding: "14px 16px", color: "var(--muted-foreground)" }}>{item.nama_kecamatan}</td>
                          <td style={{ textAlign: "center", padding: "14px 16px", fontWeight: 700, fontSize: 16 }}>{item.total_skor}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: color + "20", color: color }}>
                              {item.klasifikasi}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--muted-foreground)" }}>
                        {data.length === 0 ? "Belum ada data evaluasi." : "Desa tidak ditemukan."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )} */}

      </main>

      {/* Footer */}
      <footer style={{ padding: "40px 24px", background: "var(--card)", borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--muted-foreground)", fontSize: 14 }}>
        &copy; {new Date().getFullYear()} Dinas Komunikasi dan Informatika Kabupaten Bandung.<br />
        Hak Cipta Dilindungi.
      </footer>
    </div>
  );
}
