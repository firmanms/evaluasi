"use client";

import { useState } from "react";
import { Award, Search, Download, BarChart3, Filter } from "lucide-react";
import { getHasilEvaluasiDisplay, kecamatanData, periodeData } from "@/lib/mock-data";
import { getKlasifikasiColor } from "@/lib/scoring-engine";
import type { Klasifikasi } from "@/lib/types";

export default function HasilEvaluasiPage() {
  const [periodeId, setPeriodeId] = useState("per-02");
  const [search, setSearch] = useState("");
  const [filterKec, setFilterKec] = useState("");
  const [filterKlasifikasi, setFilterKlasifikasi] = useState("");

  const data = getHasilEvaluasiDisplay(periodeId);

  const filtered = data.filter((d) => {
    const matchSearch = d.nama_desa.toLowerCase().includes(search.toLowerCase()) ||
      d.nama_kecamatan.toLowerCase().includes(search.toLowerCase());
    const desa = d as { nama_kecamatan: string; klasifikasi: Klasifikasi };
    const matchKec = filterKec
      ? kecamatanData.find((k) => k.nama_kecamatan === d.nama_kecamatan)?.id === filterKec
      : true;
    const matchKlasifikasi = filterKlasifikasi ? d.klasifikasi === filterKlasifikasi : true;
    return matchSearch && matchKec && matchKlasifikasi;
  });

  // Stats
  const avgSkor = filtered.length > 0
    ? (filtered.reduce((s, d) => s + d.total_skor, 0) / filtered.length).toFixed(1)
    : "0";

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
        <select
          className="form-select"
          style={{ width: "auto", minWidth: 180 }}
          value={periodeId}
          onChange={(e) => setPeriodeId(e.target.value)}
        >
          {periodeData.filter((p) => p.status !== "draft").map((p) => (
            <option key={p.id} value={p.id}>{p.nama_periode}</option>
          ))}
        </select>
        <div className="search-box" style={{ flex: "1 1 200px" }}>
          <Search size={16} />
          <input
            placeholder="Cari desa..."
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
          {kecamatanData.map((k) => (
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
          <strong>{filtered.length}</strong> desa • Rata-rata skor: <strong style={{ color: "var(--primary)" }}>{avgSkor}</strong>
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {(["Sangat Aktif", "Aktif", "Cukup Aktif", "Kurang Aktif", "Tidak Aktif"] as Klasifikasi[]).map((kl) => {
            const count = filtered.filter((d) => d.klasifikasi === kl).length;
            return (
              <span key={kl} className={`badge badge-${kl.toLowerCase().replace(/ /g, "-")}`} style={{ fontSize: 11 }}>
                {kl}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Results Table */}
      <div className="card" style={{ padding: 0 }}>
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
              {filtered.slice(0, 50).map((item, i) => (
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
                    <span className={`badge badge-${item.klasifikasi.toLowerCase().replace(/ /g, "-")}`}>
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
        {filtered.length > 50 && (
          <div style={{ textAlign: "center", padding: 16, color: "var(--muted-foreground)", fontSize: 13 }}>
            Menampilkan 50 dari {filtered.length} data
          </div>
        )}
      </div>
    </div>
  );
}
