"use client";

import { useState } from "react";
import { Building2, Plus, Search, Edit, Trash2 } from "lucide-react";
import { kecamatanData, desaData } from "@/lib/mock-data";

export default function KecamatanPage() {
  const [search, setSearch] = useState("");

  const filtered = kecamatanData.filter((k) =>
    k.nama_kecamatan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Data Kecamatan</h1>
          <p className="page-subtitle">Kelola data 31 kecamatan di Kabupaten Bandung</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Tambah Kecamatan
        </button>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Cari kecamatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            {filtered.length} kecamatan
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>No</th>
                <th>Nama Kecamatan</th>
                <th>Jumlah Desa</th>
                <th>Jumlah Kelurahan</th>
                <th>Total</th>
                <th style={{ width: 100 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((kec, i) => {
                const desaKec = desaData.filter((d) => d.kecamatan_id === kec.id);
                const jumlahDesa = desaKec.filter((d) => d.jenis === "desa").length;
                const jumlahKel = desaKec.filter((d) => d.jenis === "kelurahan").length;
                return (
                  <tr key={kec.id}>
                    <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: "linear-gradient(135deg, #3b82f6, #1e40af)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <Building2 size={16} color="#fff" />
                        </div>
                        <span style={{ fontWeight: 500 }}>{kec.nama_kecamatan}</span>
                      </div>
                    </td>
                    <td>{jumlahDesa}</td>
                    <td>{jumlahKel}</td>
                    <td style={{ fontWeight: 600 }}>{desaKec.length}</td>
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
      </div>
    </div>
  );
}
