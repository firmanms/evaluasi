"use client";

import { Bell, Search, Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";
import { periodeData } from "@/lib/mock-data";

export function Header() {
  const [periodeId, setPeriodeId] = useState(
    periodeData.find((p) => p.status === "berjalan")?.id ?? periodeData[0].id
  );

  return (
    <header className="main-header">
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="search-box" style={{ display: "none" }}>
          {/* Hidden on small, can be shown */}
          <Search size={16} />
          <input placeholder="Cari desa, kecamatan..." />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={16} style={{ color: "var(--muted-foreground)" }} />
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 180, padding: "6px 12px", fontSize: 13 }}
            value={periodeId}
            onChange={(e) => setPeriodeId(e.target.value)}
          >
            {periodeData.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama_periode}
                {p.status === "berjalan" ? " (Aktif)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          className="btn-ghost"
          style={{
            position: "relative",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: "transparent",
          }}
        >
          <Bell size={18} style={{ color: "var(--muted-foreground)" }} />
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              background: "#ef4444",
              borderRadius: "50%",
              border: "2px solid var(--card)",
            }}
          />
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #3b82f6, #1e40af)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            SA
          </div>
          <div className="hidden md:block">
            <div style={{ fontSize: 13, fontWeight: 500 }}>Admin Diskominfo</div>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              Super Admin
            </div>
          </div>
          <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} className="hidden md:block" />
        </div>
      </div>
    </header>
  );
}
