"use client";

import { Plus, Edit, Trash2, Search, Cpu } from "lucide-react";
import { useState } from "react";
import { indikatorOpenSIDData } from "@/lib/mock-data";

export default function IndikatorOpenSIDPage() {
  const [search, setSearch] = useState("");

  const filtered = indikatorOpenSIDData.filter((ind) =>
    ind.nama_indikator.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Indikator OpenSID</h1>
          <p className="page-subtitle">Indikator tambahan khusus fitur OpenSID</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Tambah Indikator
        </button>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div className="search-box" style={{ flex: "1 1 200px" }}>
            <Search size={16} />
            <input
              placeholder="Cari indikator OpenSID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Kode</th>
                <th>Nama Indikator</th>
                <th style={{ width: 120 }}>Bobot Tambahan</th>
                <th style={{ width: 80 }}>Status</th>
                <th style={{ width: 100 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ind) => (
                <tr key={ind.id}>
                  <td>
                    <span className="badge" style={{
                      background: "rgba(245,158,11,0.12)",
                      color: "#f59e0b",
                      fontFamily: "var(--font-geist-mono)",
                    }}>
                      {ind.kode}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, marginBottom: 2 }}>
                        <Cpu size={14} color="#f59e0b" />
                        {ind.nama_indikator}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{ind.deskripsi}</div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, textAlign: "center" }}>{ind.bobot_tambahan}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={`status-dot ${ind.aktif ? "status-dot-green" : "status-dot-red"}`} />
                      <span style={{ fontSize: 13 }}>{ind.aktif ? "Aktif" : "Nonaktif"}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm"><Edit size={14} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "#ef4444" }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
