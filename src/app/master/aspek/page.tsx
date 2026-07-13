"use client";

import { Settings, Edit } from "lucide-react";
import { aspekData } from "@/lib/mock-data";

const aspekColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function AspekPage() {
  const totalBobot = aspekData.reduce((sum, a) => sum + a.bobot_persen, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Aspek & Bobot Penilaian</h1>
        <p className="page-subtitle">Konfigurasi aspek evaluasi dan bobotnya (total harus 100%)</p>
      </div>

      {/* Visual Bobot Bar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--muted-foreground)" }}>
          KOMPOSISI BOBOT
        </h3>
        <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 32, marginBottom: 16 }}>
          {aspekData.map((aspek, i) => (
            <div
              key={aspek.id}
              style={{
                width: `${aspek.bobot_persen}%`,
                background: aspekColors[i],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.3s ease",
              }}
              title={`${aspek.nama_aspek}: ${aspek.bobot_persen}%`}
            >
              {aspek.bobot_persen}%
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {aspekData.map((aspek, i) => (
            <div key={aspek.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: aspekColors[i] }} />
              <span>{aspek.nama_aspek}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Aspek Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        {aspekData.map((aspek, i) => (
          <div key={aspek.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: aspekColors[i],
            }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${aspekColors[i]}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                }}>
                  <Settings size={20} color={aspekColors[i]} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{aspek.nama_aspek}</h3>
                <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                  Aspek {i + 1} dari 4
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: aspekColors[i], lineHeight: 1 }}>
                  {aspek.bobot_persen}%
                </div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>Bobot</div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
                <Edit size={14} /> Edit Bobot
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total Check */}
      <div className="card" style={{
        marginTop: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: totalBobot === 100 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
        borderColor: totalBobot === 100 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
      }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>Total Bobot</span>
        <span style={{
          fontSize: 20,
          fontWeight: 700,
          color: totalBobot === 100 ? "#10b981" : "#ef4444",
        }}>
          {totalBobot}%
          {totalBobot === 100 ? " ✓" : " ✗ (harus 100%)"}
        </span>
      </div>
    </div>
  );
}
