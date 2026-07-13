"use client";

import { Calendar, Plus, Play, CheckCircle, Clock, Edit } from "lucide-react";
import { periodeData } from "@/lib/mock-data";

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Play; label: string }> = {
  draft: { color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: Clock, label: "Draft" },
  berjalan: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: Play, label: "Berjalan" },
  selesai: { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: CheckCircle, label: "Selesai" },
};

export default function PeriodePage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Periode Evaluasi</h1>
          <p className="page-subtitle">Kelola periode evaluasi berkala</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Buka Periode Baru
        </button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {periodeData.map((periode) => {
          const cfg = statusConfig[periode.status];
          const StatusIcon = cfg.icon;
          return (
            <div key={periode.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
              {periode.status === "berjalan" && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                }} />
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <StatusIcon size={22} color={cfg.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{periode.nama_periode}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, fontSize: 13, color: "var(--muted-foreground)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={14} />
                        {new Date(periode.tanggal_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span>—</span>
                      <span>
                        {new Date(periode.tanggal_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="badge" style={{ background: cfg.bg, color: cfg.color, borderColor: `${cfg.color}30` }}>
                    <StatusIcon size={12} style={{ marginRight: 4 }} />
                    {cfg.label}
                  </span>
                  <button className="btn btn-secondary btn-sm">
                    <Edit size={14} /> Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
