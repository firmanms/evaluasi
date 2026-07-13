"use client";

import { useState } from "react";
import { ClipboardCheck, Search, ChevronRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { desaData, kecamatanData, hasilEvaluasiData, periodeData } from "@/lib/mock-data";
import { getKlasifikasiColor } from "@/lib/scoring-engine";

export default function PenilaianPage() {
  const [search, setSearch] = useState("");
  const [filterKec, setFilterKec] = useState("");

  const aktivPeriode = periodeData.find((p) => p.status === "berjalan");
  const currentPeriodeId = aktivPeriode?.id ?? "per-02";

  const desaList = desaData
    .map((desa) => {
      const kec = kecamatanData.find((k) => k.id === desa.kecamatan_id);
      const hasil = hasilEvaluasiData.find(
        (h) => h.desa_id === desa.id && h.periode_id === "per-02"
      );
      return {
        ...desa,
        nama_kecamatan: kec?.nama_kecamatan ?? "",
        sudahDinilai: !!hasil,
        totalSkor: hasil?.total_skor ?? null,
        klasifikasi: hasil?.klasifikasi ?? null,
      };
    })
    .filter((d) => {
      const matchSearch = d.nama_desa.toLowerCase().includes(search.toLowerCase()) ||
        d.nama_kecamatan.toLowerCase().includes(search.toLowerCase());
      const matchKec = filterKec ? d.kecamatan_id === filterKec : true;
      return matchSearch && matchKec;
    });

  const dinilai = desaList.filter((d) => d.sudahDinilai).length;
  const total = desaList.length;
  const persen = total > 0 ? Math.round((dinilai / total) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Input Penilaian</h1>
        <p className="page-subtitle">
          Penilaian desa untuk periode {aktivPeriode?.nama_periode ?? "Triwulan II 2026"}
        </p>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Progress Penilaian</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>
            {dinilai} / {total} desa ({persen}%)
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${persen}%`,
              background: persen === 100
                ? "linear-gradient(90deg, #10b981, #059669)"
                : "linear-gradient(90deg, #3b82f6, #60a5fa)",
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
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
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>No</th>
                <th>Desa/Kelurahan</th>
                <th>Kecamatan</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 80 }}>Skor</th>
                <th style={{ width: 120 }}>Klasifikasi</th>
                <th style={{ width: 80 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {desaList.slice(0, 50).map((desa, i) => (
                <tr key={desa.id}>
                  <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{desa.nama_desa}</td>
                  <td style={{ color: "var(--muted-foreground)" }}>{desa.nama_kecamatan}</td>
                  <td>
                    {desa.sudahDinilai ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#10b981", fontSize: 13 }}>
                        <CheckCircle2 size={14} /> Dinilai
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#f59e0b", fontSize: 13 }}>
                        <Clock size={14} /> Belum
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: desa.totalSkor ? getKlasifikasiColor(desa.klasifikasi!) : "var(--muted-foreground)" }}>
                    {desa.totalSkor ?? "—"}
                  </td>
                  <td>
                    {desa.klasifikasi ? (
                      <span
                        className={`badge badge-${desa.klasifikasi.toLowerCase().replace(/ /g, "-")}`}
                      >
                        {desa.klasifikasi}
                      </span>
                    ) : (
                      <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>—</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/penilaian/${desa.id}`}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 12, padding: "4px 10px" }}
                    >
                      Nilai <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {desaList.length > 50 && (
          <div style={{ textAlign: "center", padding: 16, color: "var(--muted-foreground)", fontSize: 13 }}>
            Menampilkan 50 dari {desaList.length} data
          </div>
        )}
      </div>
    </div>
  );
}
