"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Award, Search, Download, BarChart3, Filter, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getKlasifikasiColor, getKlasifikasiColorClass } from "@/lib/scoring-engine";
import type { Klasifikasi } from "@/lib/types";

function HasilEvaluasiContent() {
  const searchParams = useSearchParams();
  const activePeriodeId = searchParams.get("periode");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  
  const [search, setSearch] = useState("");
  const [filterKec, setFilterKec] = useState("");
  const [filterKlasifikasi, setFilterKlasifikasi] = useState("");

  useEffect(() => {
    fetchKecamatan();
  }, []);

  useEffect(() => {
    async function init() {
      let pId = activePeriodeId;
      if (!pId) {
        // Fetch active periode
        const { data } = await supabase.from("master_periode").select("id").eq("status_aktif", true).single();
        if (data) pId = data.id;
      }
      if (pId) {
        fetchHasilEvaluasi(pId);
      } else {
        setLoading(false); // No active period found
      }
    }
    init();
  }, [activePeriodeId]);

  async function fetchKecamatan() {
    try {
      const { data } = await supabase.from("kecamatan").select("*").order("nama_kecamatan");
      if (data) setKecamatanList(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchHasilEvaluasi(periodeId: string) {
    setLoading(true);
    try {
      const { data: res, error } = await supabase
        .from("hasil_evaluasi")
        .select("*, desa(nama_desa, kecamatan_id, kecamatan(nama_kecamatan))")
        .eq("periode_id", periodeId)
        .order("total_skor", { ascending: false });

      if (error) throw error;

      // Flatten the structure for easier filtering
      const flatData = (res || []).map((row) => ({
        ...row,
        nama_desa: row.desa?.nama_desa || "Desa tidak diketahui",
        nama_kecamatan: row.desa?.kecamatan?.nama_kecamatan || "",
        kecamatan_id: row.desa?.kecamatan_id || "",
      }));

      setData(flatData);
    } catch (err) {
      console.error("Failed to load hasil evaluasi", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = data.filter((d) => {
    const matchSearch = d.nama_desa.toLowerCase().includes(search.toLowerCase()) ||
      d.nama_kecamatan.toLowerCase().includes(search.toLowerCase());
    
    const matchKec = filterKec ? d.kecamatan_id === filterKec : true;
    const matchKlasifikasi = filterKlasifikasi ? d.klasifikasi === filterKlasifikasi : true;
    
    return matchSearch && matchKec && matchKlasifikasi;
  });

  // Stats
  const avgSkor = filtered.length > 0
    ? (filtered.reduce((s, d) => s + Number(d.total_skor), 0) / filtered.length).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", color: "var(--muted-foreground)" }}>
        <Loader2 className="animate-spin" size={32} style={{ marginBottom: 12 }} />
        <p>Memuat hasil evaluasi...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Hasil Evaluasi</h1>
          <p className="page-subtitle">Peringkat dan klasifikasi website desa berdasarkan skor evaluasi</p>
        </div>
        <button className="btn btn-secondary">
          <Download size={16} /> Ekspor Excel
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="search-box" style={{ flex: "1 1 200px" }}>
          <Search size={16} />
          <input
            placeholder="Cari nama desa atau kecamatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: "auto", minWidth: 160 }}
          value={filterKec}
          onChange={(e) => setFilterKec(e.target.value)}
        >
          <option value="">Semua Kecamatan</option>
          {kecamatanList.map((k) => (
            <option key={k.id} value={k.id}>{k.nama_kecamatan}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ width: "auto", minWidth: 160 }}
          value={filterKlasifikasi}
          onChange={(e) => setFilterKlasifikasi(e.target.value)}
        >
          <option value="">Semua Klasifikasi</option>
          <option value="Sangat Aktif">Sangat Aktif</option>
          <option value="Aktif">Aktif</option>
          <option value="Cukup Aktif">Cukup Aktif</option>
          <option value="Kurang Aktif">Kurang Aktif</option>
          <option value="Tidak Aktif">Tidak Aktif</option>
        </select>
      </div>

      {/* Summary bar */}
      <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 14 }}>
          <strong>{filtered.length}</strong> desa dinilai • Rata-rata skor: <strong style={{ color: "var(--primary)" }}>{avgSkor}</strong>
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["Sangat Aktif", "Aktif", "Cukup Aktif", "Kurang Aktif", "Tidak Aktif"] as Klasifikasi[]).map((kl) => {
            const count = filtered.filter((d) => d.klasifikasi === kl).length;
            const colorClass = getKlasifikasiColorClass(kl);
            
            // Extract colors for custom styling
            const colorBase = getKlasifikasiColor(kl);
            
            return (
              <span key={kl} className="badge" style={{ fontSize: 11, background: `${colorBase}20`, color: colorBase, border: `1px solid ${colorBase}40` }}>
                {kl}: <strong>{count}</strong>
              </span>
            );
          })}
        </div>
      </div>

      {/* Results Table */}
      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
            Tidak ada hasil evaluasi yang sesuai dengan filter yang dipilih.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Rank</th>
                  <th>Desa/Kelurahan</th>
                  <th>Kecamatan</th>
                  <th style={{ width: 90 }}>Skor</th>
                  <th style={{ width: 140 }}>Klasifikasi</th>
                  <th>Skor Visual</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: i < 3
                          ? i === 0 ? "linear-gradient(135deg, #fbbf24, #d97706)"
                            : i === 1 ? "linear-gradient(135deg, #d1d5db, #9ca3af)"
                            : "linear-gradient(135deg, #d97706, #92400e)"
                          : "var(--muted)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                        color: i < 3 ? "#fff" : "var(--muted-foreground)",
                      }}>
                        {i + 1}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{item.nama_desa}</td>
                    <td style={{ color: "var(--muted-foreground)" }}>{item.nama_kecamatan}</td>
                    <td style={{ fontWeight: 700, fontSize: 16, color: getKlasifikasiColor(item.klasifikasi) }}>
                      {item.total_skor}
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        background: `${getKlasifikasiColor(item.klasifikasi)}20`, 
                        color: getKlasifikasiColor(item.klasifikasi),
                        border: `1px solid ${getKlasifikasiColor(item.klasifikasi)}40`
                      }}>
                        {item.klasifikasi}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${item.total_skor}%`,
                              background: getKlasifikasiColor(item.klasifikasi),
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)", minWidth: 30 }}>
                          {item.total_skor}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HasilEvaluasiPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", color: "var(--muted-foreground)" }}>
        <Loader2 className="animate-spin" size={32} style={{ marginBottom: 12 }} />
        <p>Memuat halaman...</p>
      </div>
    }>
      <HasilEvaluasiContent />
    </Suspense>
  );
}
