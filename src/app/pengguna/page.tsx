"use client";

import { Users, Plus, Edit, Trash2, Shield, Search } from "lucide-react";
import { useState } from "react";
import { usersData, kecamatanData, desaData } from "@/lib/mock-data";
import type { RoleUser } from "@/lib/types";

const roleConfig: Record<RoleUser, { label: string; color: string; bg: string }> = {
  super_admin: { label: "Super Admin", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  admin_kecamatan: { label: "Admin Kecamatan", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  operator_desa: { label: "Operator Desa", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  viewer: { label: "Viewer", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
};

export default function PenggunaPage() {
  const [search, setSearch] = useState("");

  const filtered = usersData.filter(
    (u) =>
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Manajemen Pengguna</h1>
          <p className="page-subtitle">Kelola akun pengguna dan hak akses</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Tambah Pengguna
        </button>
      </div>

      {/* Role Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        {(Object.keys(roleConfig) as RoleUser[]).map((role) => {
          const cfg = roleConfig[role];
          const count = usersData.filter((u) => u.role === role).length;
          return (
            <div key={role} className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Shield size={20} color={cfg.color} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: cfg.color }}>{count}</div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{cfg.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <div className="search-box" style={{ maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Cari pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>No</th>
                <th>Pengguna</th>
                <th>Email</th>
                <th>Role</th>
                <th>Wilayah</th>
                <th style={{ width: 100 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => {
                const cfg = roleConfig[user.role];
                const kec = user.kecamatan_id ? kecamatanData.find((k) => k.id === user.kecamatan_id) : null;
                const desa = user.desa_id ? desaData.find((d) => d.id === user.desa_id) : null;
                const wilayah = desa
                  ? `Desa ${desa.nama_desa}`
                  : kec
                  ? `Kec. ${kec.nama_kecamatan}`
                  : "Kabupaten";

                return (
                  <tr key={user.id}>
                    <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}aa)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 13, fontWeight: 700,
                        }}>
                          {user.nama.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{user.nama}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{user.email}</td>
                    <td>
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{wilayah}</td>
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
