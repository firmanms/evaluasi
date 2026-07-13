"use client";

import { useState } from "react";
import { AlertTriangle, Clock, CheckCircle, PlayCircle, Filter, Plus } from "lucide-react";
import { kendalaData, desaData, kecamatanData } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";
import type { StatusKendala } from "@/lib/types";

const statusConfig: Record<StatusKendala, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  baru: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: AlertTriangle, label: "Baru" },
  diproses: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: PlayCircle, label: "Diproses" },
  selesai: { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: CheckCircle, label: "Selesai" },
};

export default function KendalaPage() {
  const [filterStatus, setFilterStatus] = useState<string>("");

  const dataWithDesa = kendalaData.map((k) => {
    const desa = desaData.find((d) => d.id === k.desa_id);
    const kec = kecamatanData.find((kc) => kc.id === desa?.kecamatan_id);
    return { ...k, desa, kec };
  });

  const filtered = filterStatus
    ? dataWithDesa.filter((k) => k.status === filterStatus)
    : dataWithDesa;

  const countByStatus = {
    baru: dataWithDesa.filter((k) => k.status === "baru").length,
    diproses: dataWithDesa.filter((k) => k.status === "diproses").length,
    selesai: dataWithDesa.filter((k) => k.status === "selesai").length,
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Kendala & Tindak Lanjut</h1>
          <p className="page-subtitle">Pencatatan kendala yang dilaporkan desa dan status tindak lanjutnya</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Laporkan Kendala
        </button>
      </div>

      {/* Status Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        {(Object.keys(statusConfig) as StatusKendala[]).map((status) => {
          const cfg = statusConfig[status];
          const Icon = cfg.icon;
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(isActive ? "" : status)}
              className="card"
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: isActive ? `2px solid ${cfg.color}` : undefined,
                background: isActive ? cfg.bg : undefined,
                textAlign: "left",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={20} color={cfg.color} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: cfg.color }}>{countByStatus[status]}</div>
                <div style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{cfg.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Kendala Cards */}
      <div style={{ display: "grid", gap: 16 }}>
        {filtered.map((item) => {
          const cfg = statusConfig[item.status];
          const Icon = cfg.icon;
          return (
            <div key={item.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", top: 0, left: 0, width: 4, bottom: 0,
                background: cfg.color,
              }} />
              <div style={{ paddingLeft: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{item.desa?.nama_desa}</span>
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                        Kec. {item.kec?.nama_kecamatan}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                      Dilaporkan: {formatDateTime(item.dilaporkan_pada)}
                    </span>
                  </div>
                  <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                    <Icon size={12} style={{ marginRight: 4 }} /> {cfg.label}
                  </span>
                </div>

                <div style={{
                  background: "var(--muted)", padding: "12px 16px", borderRadius: 8,
                  fontSize: 14, lineHeight: 1.6, marginBottom: 12,
                }}>
                  {item.deskripsi}
                </div>

                {item.tindak_lanjut && (
                  <div style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: "#10b981" }}>Tindak Lanjut: </span>
                    <span style={{ color: "var(--muted-foreground)" }}>{item.tindak_lanjut}</span>
                  </div>
                )}

                {item.status === "baru" && !item.tindak_lanjut && (
                  <div style={{ fontSize: 13, color: "#f59e0b", fontStyle: "italic" }}>
                    Belum ada tindak lanjut
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
