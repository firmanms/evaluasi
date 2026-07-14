"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Eye, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getKlasifikasiColor } from "@/lib/scoring-engine";

export default function LaporanPage() {
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

  const filtered = desaList.filter((d) => {
    const matchSearch = d.nama_desa.toLowerCase().includes(search.toLowerCase()) ||
      d.nama_kecamatan.toLowerCase().includes(search.toLowerCase());
    const matchKec = filterKec ? d.kecamatan_id === filterKec : true;
    return matchSearch && matchKec;
  });

  // Only show desa that have evaluation results
  const evaluated = filtered.filter(d => d.totalSkor !== null);
  const totalDinilai = desaList.filter(d => d.totalSkor !== null).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Laporan & Ekspor</h1>
          <p className="page-subtitle">
            Lihat rapor hasil evaluasi dan download sebagai PDF
          </p>
        </div>

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
      </div>

      {error && (
        <div style={{
          padding: 16, borderRadius: 12, backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 8
        }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={22} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Total Sudah Dinilai</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{totalDinilai} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--muted-foreground)" }}>/ {desaList.length} desa</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="search-box" style={{ flex: "1 1 200px" }}>
          <Search size={16} />
          <input
            placeholder="Cari desa atau kecamatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
      </div>

      {/* Desa List */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--muted-foreground)" }}>
            <Loader2 className="animate-spin" style={{ margin: "0 auto", marginBottom: 12 }} size={24} />
            Memuat data laporan...
          </div>
        ) : (
          <>
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
                  {evaluated.slice(0, 50).map((desa, i) => (
                    <tr key={desa.id}>
                      <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>
                        {desa.nama_desa}
                        {desa.jenis === "kelurahan" && <span style={{ marginLeft: 6, fontSize: 11, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", padding: "2px 6px", borderRadius: 4 }}>Kel</span>}
                      </td>
                      <td style={{ color: "var(--muted-foreground)" }}>{desa.nama_kecamatan}</td>
                      <td style={{ fontWeight: 700, textAlign: "center", color: getKlasifikasiColor(desa.klasifikasi!) }}>
                        {desa.totalSkor !== null ? Number(desa.totalSkor).toFixed(1) : "—"}
                      </td>
                      <td>
                        {desa.klasifikasi ? (
                          <span
                            className={`badge badge-${desa.klasifikasi.toLowerCase().replace(/ /g, "-")}`}
                            style={{ width: "100%", justifyContent: "center" }}
                          >
                            {desa.klasifikasi}
                          </span>
                        ) : (
                          <span style={{ color: "var(--muted-foreground)", fontSize: 13, textAlign: "center", display: "block" }}>—</span>
                        )}
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
                  {evaluated.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--muted-foreground)" }}>
                        Belum ada desa yang memiliki hasil evaluasi untuk periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {evaluated.length > 50 && (
              <div style={{ textAlign: "center", padding: 16, color: "var(--muted-foreground)", fontSize: 13 }}>
                Menampilkan 50 dari {evaluated.length} desa. Gunakan filter untuk mencari.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
