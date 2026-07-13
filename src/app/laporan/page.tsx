"use client";

import { useState } from "react";
import { FileText, Download, FileSpreadsheet, File, Eye, Calendar } from "lucide-react";
import { periodeData, kecamatanData } from "@/lib/mock-data";

const reportTypes = [
  {
    id: "rekap-kabupaten",
    title: "Rekap Evaluasi Kabupaten",
    desc: "Ringkasan seluruh hasil evaluasi tingkat Kabupaten Bandung",
    icon: FileText,
    color: "#3b82f6",
  },
  {
    id: "rekap-kecamatan",
    title: "Rekap per Kecamatan",
    desc: "Hasil evaluasi dikelompokkan per kecamatan",
    icon: FileSpreadsheet,
    color: "#10b981",
  },
  {
    id: "rekap-desa",
    title: "Detail per Desa",
    desc: "Laporan detail penilaian per indikator untuk setiap desa",
    icon: File,
    color: "#8b5cf6",
  },
  {
    id: "perbandingan-periode",
    title: "Perbandingan Antar Periode",
    desc: "Analisis tren dan perubahan skor antar periode evaluasi",
    icon: Calendar,
    color: "#f59e0b",
  },
];

export default function LaporanPage() {
  const [selectedReport, setSelectedReport] = useState("rekap-kabupaten");
  const [selectedPeriode, setSelectedPeriode] = useState("per-02");
  const [selectedKec, setSelectedKec] = useState("");

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Laporan & Ekspor</h1>
        <p className="page-subtitle">Generate laporan evaluasi dalam format PDF atau Excel</p>
      </div>

      {/* Report Type Selection */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
        {reportTypes.map((rt) => {
          const Icon = rt.icon;
          const isActive = selectedReport === rt.id;
          return (
            <button
              key={rt.id}
              onClick={() => setSelectedReport(rt.id)}
              className="card"
              style={{
                cursor: "pointer",
                textAlign: "left",
                border: isActive ? `2px solid ${rt.color}` : undefined,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {isActive && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: rt.color,
                }} />
              )}
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `${rt.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12,
              }}>
                <Icon size={22} color={rt.color} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{rt.title}</h3>
              <p style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                {rt.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Configuration */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Konfigurasi Laporan</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Periode Evaluasi</label>
            <select
              className="form-select"
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
            >
              {periodeData.filter((p) => p.status !== "draft").map((p) => (
                <option key={p.id} value={p.id}>{p.nama_periode}</option>
              ))}
            </select>
          </div>
          {(selectedReport === "rekap-kecamatan" || selectedReport === "rekap-desa") && (
            <div className="form-group">
              <label className="form-label">Kecamatan</label>
              <select
                className="form-select"
                value={selectedKec}
                onChange={(e) => setSelectedKec(e.target.value)}
              >
                <option value="">Semua Kecamatan</option>
                {kecamatanData.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama_kecamatan}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Format</label>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }}>
                <FileSpreadsheet size={16} color="#10b981" /> Excel
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }}>
                <FileText size={16} color="#ef4444" /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview & Download */}
      <div className="card" style={{ textAlign: "center", padding: 48 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "linear-gradient(135deg, #3b82f6, #1e40af)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <Download size={28} color="#fff" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Siap Generate Laporan</h3>
        <p style={{ fontSize: 14, color: "var(--muted-foreground)", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
          Pilih jenis laporan, periode, dan format di atas, lalu klik tombol di bawah untuk men-generate laporan.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn btn-secondary" style={{ padding: "10px 24px" }}>
            <Eye size={16} /> Preview
          </button>
          <button className="btn btn-primary" style={{ padding: "10px 24px" }}>
            <Download size={16} /> Download Laporan
          </button>
        </div>
      </div>
    </div>
  );
}
