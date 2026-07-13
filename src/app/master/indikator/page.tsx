"use client";

import { useState } from "react";
import { ListChecks, Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { indikatorData, aspekData } from "@/lib/mock-data";

export default function IndikatorPage() {
  const [filterAspek, setFilterAspek] = useState("");
  const [search, setSearch] = useState("");

  const filtered = indikatorData.filter((ind) => {
    const matchSearch = ind.nama_indikator.toLowerCase().includes(search.toLowerCase());
    const matchAspek = filterAspek ? ind.aspek_id === filterAspek : true;
    return matchSearch && matchAspek;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Master Indikator</h1>
          <p className="page-subtitle">Indikator penilaian umum website desa</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Tambah Indikator
        </button>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div className="search-box" style={{ flex: "1 1 200px" }}>
            <Search size={16} />
            <input
              placeholder="Cari indikator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 200, padding: "8px 12px" }}
            value={filterAspek}
            onChange={(e) => setFilterAspek(e.target.value)}
          >
            <option value="">Semua Aspek</option>
            {aspekData.map((a) => (
              <option key={a.id} value={a.id}>{a.nama_aspek}</option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Kode</th>
                <th>Nama Indikator</th>
                <th>Aspek</th>
                <th style={{ width: 80 }}>Bobot</th>
                <th style={{ width: 80 }}>Status</th>
                <th style={{ width: 100 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ind) => {
                const aspek = aspekData.find((a) => a.id === ind.aspek_id);
                const aspekColors: Record<string, string> = {
                  "aspek-1": "#3b82f6",
                  "aspek-2": "#10b981",
                  "aspek-3": "#f59e0b",
                  "aspek-4": "#8b5cf6",
                };
                return (
                  <tr key={ind.id}>
                    <td>
                      <span className="badge" style={{ background: "var(--muted)", color: "var(--foreground)", fontFamily: "var(--font-geist-mono)" }}>
                        {ind.kode}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 2 }}>{ind.nama_indikator}</div>
                        <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{ind.deskripsi}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: `${aspekColors[ind.aspek_id]}15`,
                        color: aspekColors[ind.aspek_id],
                        borderColor: `${aspekColors[ind.aspek_id]}30`,
                      }}>
                        {aspek?.nama_aspek}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, textAlign: "center" }}>{ind.bobot}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
