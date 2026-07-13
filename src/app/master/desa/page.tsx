"use client";

import { useState } from "react";
import { MapPin, Plus, Search, Edit, Trash2, ExternalLink, Filter } from "lucide-react";
import { desaData, kecamatanData } from "@/lib/mock-data";

export default function DesaPage() {
  const [search, setSearch] = useState("");
  const [filterKec, setFilterKec] = useState("");

  const filtered = desaData.filter((d) => {
    const matchSearch = d.nama_desa.toLowerCase().includes(search.toLowerCase());
    const matchKec = filterKec ? d.kecamatan_id === filterKec : true;
    return matchSearch && matchKec;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Data Desa / Kelurahan</h1>
          <p className="page-subtitle">Kelola data {desaData.length} desa dan kelurahan</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Tambah Desa
        </button>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div className="search-box" style={{ flex: "1 1 200px" }}>
            <Search size={16} />
            <input
              placeholder="Cari nama desa..."
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
          <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            {filtered.length} data
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>No</th>
                <th>Nama Desa/Kelurahan</th>
                <th>Kecamatan</th>
                <th>Jenis</th>
                <th>URL Website</th>
                <th>Status</th>
                <th style={{ width: 100 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((desa, i) => {
                const kec = kecamatanData.find((k) => k.id === desa.kecamatan_id);
                return (
                  <tr key={desa.id}>
                    <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: desa.jenis === "kelurahan"
                            ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
                            : "linear-gradient(135deg, #10b981, #059669)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <MapPin size={16} color="#fff" />
                        </div>
                        <span style={{ fontWeight: 500 }}>{desa.nama_desa}</span>
                      </div>
                    </td>
                    <td>{kec?.nama_kecamatan}</td>
                    <td>
                      <span className="badge" style={{
                        background: desa.jenis === "kelurahan" ? "rgba(139,92,246,0.12)" : "rgba(16,185,129,0.12)",
                        color: desa.jenis === "kelurahan" ? "#8b5cf6" : "#10b981",
                        textTransform: "capitalize"
                      }}>
                        {desa.jenis}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--primary)" }}>
                        <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {desa.url_website}
                        </span>
                        <ExternalLink size={12} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className={`status-dot ${desa.status_aktif ? "status-dot-green" : "status-dot-red"}`} />
                        <span style={{ fontSize: 13 }}>{desa.status_aktif ? "Aktif" : "Tidak Aktif"}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" title="Edit">
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" title="Hapus" style={{ color: "#ef4444" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && (
          <div style={{ textAlign: "center", padding: 16, color: "var(--muted-foreground)", fontSize: 13 }}>
            Menampilkan 50 dari {filtered.length} data. Gunakan filter untuk mempersempit pencarian.
          </div>
        )}
      </div>
    </div>
  );
}
