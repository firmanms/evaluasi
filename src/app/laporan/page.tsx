"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Eye, Loader2, AlertTriangle, ChevronRight, BarChart3, MapPin, Award, TrendingUp, TrendingDown, Download } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getKlasifikasiColor, getKlasifikasi } from "@/lib/scoring-engine";

type TabId = "semua" | "kecamatan" | "klasifikasi" | "rapor-desa";

const tabs: { id: TabId; label: string; icon: any; color: string }[] = [
  { id: "semua", label: "Hasil Penilaian", icon: BarChart3, color: "#3b82f6" },
  { id: "kecamatan", label: "Per Kecamatan", icon: MapPin, color: "#10b981" },
  { id: "klasifikasi", label: "Per Klasifikasi", icon: Award, color: "#f59e0b" },
  { id: "rapor-desa", label: "Rapor Desa", icon: FileText, color: "#8b5cf6" },
];

const KLASIFIKASI_LIST = ["Sangat Aktif", "Aktif", "Cukup Aktif", "Kurang Aktif", "Tidak Aktif"];

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<TabId>("semua");
  const [search, setSearch] = useState("");
  const [filterKec, setFilterKec] = useState("");
  const [activePeriodeId, setActivePeriodeId] = useState<string>("");

  const [periodeData, setPeriodeData] = useState<any[]>([]);
  const [kecamatanData, setKecamatanData] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activePeriodeId) {
      fetchEvaluasiData(activePeriodeId);
    }
  }, [activePeriodeId]);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [periodeRes, kecRes, desaRes] = await Promise.all([
        supabase.from("periode_evaluasi").select("*").order("tanggal_mulai", { ascending: false }),
        supabase.from("kecamatan").select("*").order("nama_kecamatan"),
        supabase.from("desa").select("*, kecamatan(nama_kecamatan)").order("nama_desa")
      ]);

      if (periodeRes.error) throw periodeRes.error;
      if (kecRes.error) throw kecRes.error;
      if (desaRes.error) throw desaRes.error;

      setPeriodeData(periodeRes.data || []);
      setKecamatanData(kecRes.data || []);

      const active = periodeRes.data?.find(p => p.status === "berjalan") || periodeRes.data?.[0];

      let hasilData: any[] = [];
      if (active) {
        const { data: hasil } = await supabase
          .from("hasil_evaluasi")
          .select("desa_id, total_skor, klasifikasi, status")
          .eq("periode_id", active.id);
        hasilData = hasil || [];
      }

      const formattedDesa = (desaRes.data || []).map(d => {
        const ev = hasilData.find(h => h.desa_id === d.id);
        return {
          ...d,
          nama_kecamatan: d.kecamatan?.nama_kecamatan || "-",
          statusEvaluasi: ev?.status || "belum",
          totalSkor: ev?.total_skor ?? null,
          klasifikasi: ev?.klasifikasi ?? null,
        };
      });
      setDesaList(formattedDesa);

      if (active) {
        setActivePeriodeId(active.id);
      }
      setLoading(false);
    } catch (err: any) {
      console.error("Init Error:", err);
      setError("Gagal memuat data referensi.");
      setLoading(false);
    }
  }

  async function fetchEvaluasiData(periodeId: string) {
    setLoading(true);
    try {
      const { data: hasil, error: err } = await supabase
        .from("hasil_evaluasi")
        .select("desa_id, total_skor, klasifikasi, status")
        .eq("periode_id", periodeId);

      if (err) throw err;

      setDesaList(prev => prev.map(desa => {
        const ev = (hasil || []).find(h => h.desa_id === desa.id);
        return {
          ...desa,
          statusEvaluasi: ev?.status || "belum",
          totalSkor: ev?.total_skor ?? null,
          klasifikasi: ev?.klasifikasi ?? null,
        };
      }));
    } catch (err: any) {
      console.error("Eval Fetch Error:", err);
      setError("Gagal memuat data evaluasi.");
    } finally {
      setLoading(false);
    }
  }

  // Computed data
  // Apply kecamatan filter globally
  const evaluatedBase = desaList.filter(d => d.totalSkor !== null);
  const evaluated = evaluatedBase.filter(d => filterKec ? d.kecamatan_id === filterKec : true);
  const totalDinilai = evaluated.length;
  const avgSkor = totalDinilai > 0 ? evaluated.reduce((s, d) => s + Number(d.totalSkor), 0) / totalDinilai : 0;
  const tertinggi = totalDinilai > 0 ? Math.max(...evaluated.map(d => Number(d.totalSkor))) : 0;
  const terendah = totalDinilai > 0 ? Math.min(...evaluated.map(d => Number(d.totalSkor))) : 0;

  const filteredForRapor = evaluated.filter((d) => {
    const matchSearch = d.nama_desa.toLowerCase().includes(search.toLowerCase()) ||
      d.nama_kecamatan.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Kecamatan stats (respect filter)
  const kecamatanStatsSource = filterKec ? kecamatanData.filter(k => k.id === filterKec) : kecamatanData;
  const kecamatanStats = kecamatanStatsSource.map(kec => {
    const desaKec = evaluatedBase.filter(d => d.kecamatan_id === kec.id);
    const count = desaKec.length;
    const totalDesaKec = desaList.filter(d => d.kecamatan_id === kec.id).length;
    const avg = count > 0 ? desaKec.reduce((s, d) => s + Number(d.totalSkor), 0) / count : 0;
    const max = count > 0 ? Math.max(...desaKec.map(d => Number(d.totalSkor))) : 0;
    const min = count > 0 ? Math.min(...desaKec.map(d => Number(d.totalSkor))) : 0;
    return { ...kec, count, totalDesaKec, avg, max, min, desaList: desaKec };
  }).filter(k => k.count > 0).sort((a, b) => b.avg - a.avg);

  // Klasifikasi stats (respect filter)
  const klasifikasiStats = KLASIFIKASI_LIST.map(klas => {
    const desaKlas = evaluated.filter(d => d.klasifikasi === klas);
    return {
      label: klas,
      count: desaKlas.length,
      persen: totalDinilai > 0 ? Math.round((desaKlas.length / totalDinilai) * 100) : 0,
      color: getKlasifikasiColor(klas as any),
      desaList: desaKlas.sort((a, b) => Number(b.totalSkor) - Number(a.totalSkor)),
    };
  });

  const selectedKecName = filterKec ? kecamatanData.find(k => k.id === filterKec)?.nama_kecamatan : null;

  const tabTitles: Record<TabId, string> = {
    semua: "Laporan Hasil Penilaian Seluruh Desa",
    kecamatan: "Laporan Hasil Penilaian Per Kecamatan",
    klasifikasi: "Laporan Hasil Penilaian Per Klasifikasi",
    "rapor-desa": "Rapor Desa",
  };

  const currentPeriode = periodeData.find(p => p.id === activePeriodeId);

  return (
    <div className="animate-fade-in">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .laporan-printable, .laporan-printable * { visibility: visible; }
          .laporan-printable {
            position: absolute; left: 0; top: 0; width: 100%;
            padding: 20px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; break-inside: avoid; }
          table { font-size: 12px; }
        }
        .print-only { display: none; }
      `}</style>
      <div className="page-header no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Laporan & Ekspor</h1>
          <p className="page-subtitle">
            Lihat hasil penilaian, rekap per kecamatan, klasifikasi, dan rapor desa
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {periodeData.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, color: "var(--muted-foreground)" }}>Periode:</span>
              <select
                className="form-select"
                style={{ minWidth: 200, fontWeight: 500, padding: "8px 12px" }}
                value={activePeriodeId}
                onChange={(e) => setActivePeriodeId(e.target.value)}
                disabled={loading}
              >
                {periodeData.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nama_periode} {p.status === 'berjalan' ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 180, padding: "8px 12px" }}
            value={filterKec}
            onChange={(e) => setFilterKec(e.target.value)}
          >
            <option value="">Semua Kecamatan</option>
            {kecamatanData.map((k) => (
              <option key={k.id} value={k.id}>{k.nama_kecamatan}</option>
            ))}
          </select>
          {activeTab !== "rapor-desa" && (
            <button className="btn btn-primary" onClick={() => window.print()} style={{ gap: 6 }}>
              <Download size={16} /> Download PDF
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          padding: 16, borderRadius: 12, backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 8
        }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="no-print" style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 20px",
                background: isActive ? tab.color : "var(--card)",
                color: isActive ? "#fff" : "var(--muted-foreground)",
                border: "1px solid",
                borderColor: isActive ? tab.color : "var(--border)",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Print Header (only visible when printing) */}
      <div className="print-only" style={{ textAlign: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #1e3a5f" }}>
        <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4, color: "#666" }}>Pemerintah Kabupaten Bandung</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "8px 0" }}>{tabTitles[activeTab]}</h2>
        <div style={{ fontSize: 13, color: "#666" }}>
          Periode: {currentPeriode?.nama_periode || "-"}
          {selectedKecName && ` • Kecamatan: ${selectedKecName}`}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: "center", color: "var(--muted-foreground)" }}>
          <Loader2 className="animate-spin" style={{ margin: "0 auto", marginBottom: 12 }} size={24} />
          Memuat data laporan...
        </div>
      ) : (
        <div className="laporan-printable">
          {/* ================ TAB: SEMUA ================ */}
          {activeTab === "semua" && (
            <div className="animate-fade-in">
              {/* Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                <SummaryCard icon={<BarChart3 size={22} color="#3b82f6" />} label="Total Dinilai" value={`${totalDinilai} / ${desaList.length}`} sub="desa" bg="#3b82f6" />
                <SummaryCard icon={<Award size={22} color="#10b981" />} label="Rata-rata Skor" value={avgSkor.toFixed(1)} sub="dari 100" bg="#10b981" />
                <SummaryCard icon={<TrendingUp size={22} color="#8b5cf6" />} label="Skor Tertinggi" value={tertinggi.toFixed(1)} sub="" bg="#8b5cf6" />
                <SummaryCard icon={<TrendingDown size={22} color="#f59e0b" />} label="Skor Terendah" value={terendah.toFixed(1)} sub="" bg="#f59e0b" />
              </div>

              {/* Klasifikasi Distribution Bar */}
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Distribusi Klasifikasi</h3>
                <div style={{ display: "flex", height: 32, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
                  {klasifikasiStats.map(k => k.count > 0 && (
                    <div key={k.label} title={`${k.label}: ${k.count} desa (${k.persen}%)`} style={{
                      width: `${k.persen}%`,
                      background: k.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 11, fontWeight: 700,
                      minWidth: k.persen > 5 ? undefined : 0,
                      transition: "width 0.5s ease",
                    }}>
                      {k.persen >= 8 ? `${k.persen}%` : ""}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  {klasifikasiStats.map(k => (
                    <div key={k.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: k.color }} />
                      <span style={{ color: "var(--muted-foreground)" }}>{k.label}:</span>
                      <span style={{ fontWeight: 600 }}>{k.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Table */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Hasil Penilaian Semua Desa</h3>
                  <span className="badge">{totalDinilai} desa dinilai</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 50 }}>No</th>
                        <th>Desa/Kelurahan</th>
                        <th>Kecamatan</th>
                        <th style={{ width: 80, textAlign: "center" }}>Skor</th>
                        <th style={{ width: 150 }}>Klasifikasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluated
                        .sort((a, b) => Number(b.totalSkor) - Number(a.totalSkor))
                        .map((desa, i) => (
                        <tr key={desa.id}>
                          <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                          <td style={{ fontWeight: 500 }}>
                            {desa.nama_desa}
                            {desa.jenis === "kelurahan" && <span style={{ marginLeft: 6, fontSize: 11, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", padding: "2px 6px", borderRadius: 4 }}>Kel</span>}
                          </td>
                          <td style={{ color: "var(--muted-foreground)" }}>{desa.nama_kecamatan}</td>
                          <td style={{ fontWeight: 700, textAlign: "center", color: getKlasifikasiColor(desa.klasifikasi!) }}>{Number(desa.totalSkor).toFixed(1)}</td>
                          <td>
                            <span className={`badge badge-${desa.klasifikasi?.toLowerCase().replace(/ /g, "-")}`} style={{ width: "100%", justifyContent: "center" }}>
                              {desa.klasifikasi}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {evaluated.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: "var(--muted-foreground)" }}>Belum ada data evaluasi.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================ TAB: KECAMATAN ================ */}
          {activeTab === "kecamatan" && (
            <div className="animate-fade-in">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                <SummaryCard icon={<MapPin size={22} color="#10b981" />} label="Kecamatan Dinilai" value={`${kecamatanStats.length}`} sub={`dari ${kecamatanData.length}`} bg="#10b981" />
                <SummaryCard icon={<Award size={22} color="#3b82f6" />} label="Rata-rata Tertinggi" value={kecamatanStats.length > 0 ? kecamatanStats[0].avg.toFixed(1) : "0"} sub={kecamatanStats.length > 0 ? kecamatanStats[0].nama_kecamatan : ""} bg="#3b82f6" />
              </div>

              {kecamatanStats.map((kec, idx) => (
                <div key={kec.id} className="card" style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
                  <div style={{
                    padding: "16px 24px",
                    background: "rgba(0,0,0,0.02)",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "rgba(16,185,129,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 14, color: "#10b981"
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Kec. {kec.nama_kecamatan}</h3>
                        <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{kec.count} dari {kec.totalDesaKec} desa dinilai</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Rata-rata</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: getKlasifikasiColor(getKlasifikasi(kec.avg)) }}>{kec.avg.toFixed(1)}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Tertinggi</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>{kec.max.toFixed(1)}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Terendah</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}>{kec.min.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>No</th>
                          <th>Desa/Kelurahan</th>
                          <th style={{ width: 80, textAlign: "center" }}>Skor</th>
                          <th style={{ width: 150 }}>Klasifikasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kec.desaList.sort((a: any, b: any) => Number(b.totalSkor) - Number(a.totalSkor)).map((desa: any, i: number) => (
                          <tr key={desa.id}>
                            <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                            <td style={{ fontWeight: 500 }}>
                              {desa.nama_desa}
                              {desa.jenis === "kelurahan" && <span style={{ marginLeft: 6, fontSize: 11, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", padding: "2px 6px", borderRadius: 4 }}>Kel</span>}
                            </td>
                            <td style={{ fontWeight: 700, textAlign: "center", color: getKlasifikasiColor(desa.klasifikasi!) }}>{Number(desa.totalSkor).toFixed(1)}</td>
                            <td>
                              <span className={`badge badge-${desa.klasifikasi?.toLowerCase().replace(/ /g, "-")}`} style={{ width: "100%", justifyContent: "center" }}>
                                {desa.klasifikasi}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {kecamatanStats.length === 0 && (
                <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
                  Belum ada data evaluasi per kecamatan.
                </div>
              )}
            </div>
          )}

          {/* ================ TAB: KLASIFIKASI ================ */}
          {activeTab === "klasifikasi" && (
            <div className="animate-fade-in">
              {/* Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
                {klasifikasiStats.map(k => (
                  <div key={k.label} className="card" style={{ textAlign: "center", borderTop: `3px solid ${k.color}` }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.count}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{k.label}</div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{k.persen}% dari total</div>
                  </div>
                ))}
              </div>

              {/* Per klasifikasi */}
              {klasifikasiStats.filter(k => k.count > 0).map(klas => (
                <div key={klas.label} className="card" style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
                  <div style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: `${klas.color}08`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${klas.color}20`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Award size={18} color={klas.color} />
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: klas.color }}>{klas.label}</h3>
                    </div>
                    <span className="badge" style={{ background: `${klas.color}15`, color: klas.color, fontWeight: 700 }}>
                      {klas.count} desa ({klas.persen}%)
                    </span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>No</th>
                          <th>Desa/Kelurahan</th>
                          <th>Kecamatan</th>
                          <th style={{ width: 80, textAlign: "center" }}>Skor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {klas.desaList.map((desa: any, i: number) => (
                          <tr key={desa.id}>
                            <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                            <td style={{ fontWeight: 500 }}>
                              {desa.nama_desa}
                              {desa.jenis === "kelurahan" && <span style={{ marginLeft: 6, fontSize: 11, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", padding: "2px 6px", borderRadius: 4 }}>Kel</span>}
                            </td>
                            <td style={{ color: "var(--muted-foreground)" }}>{desa.nama_kecamatan}</td>
                            <td style={{ fontWeight: 700, textAlign: "center", color: klas.color }}>{Number(desa.totalSkor).toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {evaluated.length === 0 && (
                <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
                  Belum ada data evaluasi.
                </div>
              )}
            </div>
          )}

          {/* ================ TAB: RAPOR DESA ================ */}
          {activeTab === "rapor-desa" && (
            <div className="animate-fade-in">
              {/* Search */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <div className="search-box" style={{ flex: "1 1 200px" }}>
                  <Search size={16} />
                  <input
                    placeholder="Cari desa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 50 }}>No</th>
                        <th>Desa/Kelurahan</th>
                        <th>Kecamatan</th>
                        <th style={{ width: 80, textAlign: "center" }}>Skor</th>
                        <th style={{ width: 140 }}>Klasifikasi</th>
                        <th style={{ width: 140 }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredForRapor.slice(0, 50).map((desa, i) => (
                        <tr key={desa.id}>
                          <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                          <td style={{ fontWeight: 500 }}>
                            {desa.nama_desa}
                            {desa.jenis === "kelurahan" && <span style={{ marginLeft: 6, fontSize: 11, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", padding: "2px 6px", borderRadius: 4 }}>Kel</span>}
                          </td>
                          <td style={{ color: "var(--muted-foreground)" }}>{desa.nama_kecamatan}</td>
                          <td style={{ fontWeight: 700, textAlign: "center", color: getKlasifikasiColor(desa.klasifikasi!) }}>
                            {Number(desa.totalSkor).toFixed(1)}
                          </td>
                          <td>
                            <span className={`badge badge-${desa.klasifikasi?.toLowerCase().replace(/ /g, "-")}`} style={{ width: "100%", justifyContent: "center" }}>
                              {desa.klasifikasi}
                            </span>
                          </td>
                          <td>
                            <Link
                              href={`/laporan/${desa.id}?periode=${activePeriodeId}`}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: 12, padding: "4px 10px", width: "100%", justifyContent: "center" }}
                            >
                              <Eye size={14} /> Lihat Rapor <ChevronRight size={14} style={{ marginLeft: 2 }} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {filteredForRapor.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--muted-foreground)" }}>
                            Belum ada desa yang memiliki hasil evaluasi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredForRapor.length > 50 && (
                  <div style={{ textAlign: "center", padding: 16, color: "var(--muted-foreground)", fontSize: 13 }}>
                    Menampilkan 50 dari {filteredForRapor.length} desa. Gunakan filter untuk mencari.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper component
function SummaryCard({ icon, label, value, sub, bg }: { icon: React.ReactNode; label: string; value: string; sub: string; bg: string }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${bg}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{value} {sub && <span style={{ fontSize: 12, fontWeight: 400, color: "var(--muted-foreground)" }}>{sub}</span>}</div>
      </div>
    </div>
  );
}

function getKlasifikasiLabel(skor: number): string {
  if (skor >= 85) return "Sangat Aktif";
  if (skor >= 70) return "Aktif";
  if (skor >= 55) return "Cukup Aktif";
  if (skor >= 40) return "Kurang Aktif";
  return "Tidak Aktif";
}
