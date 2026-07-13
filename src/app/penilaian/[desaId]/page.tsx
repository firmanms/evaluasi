"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, CheckCircle } from "lucide-react";
import { desaData, kecamatanData, indikatorData, indikatorOpenSIDData, aspekData } from "@/lib/mock-data";
import { getKlasifikasi, getKlasifikasiColor } from "@/lib/scoring-engine";

export default function PenilaianDesaPage() {
  const params = useParams();
  const desaId = params.desaId as string;

  const desa = desaData.find((d) => d.id === desaId);
  const kec = kecamatanData.find((k) => k.id === desa?.kecamatan_id);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const handleScoreChange = (indId: string, value: number) => {
    setScores((prev) => ({ ...prev, [indId]: Math.min(100, Math.max(0, value)) }));
    setSaved(false);
  };

  // Calculate totals
  const calculateTotal = () => {
    let totalSkor = 0;
    for (const aspek of aspekData) {
      const aspekInds = indikatorData.filter((ind) => ind.aspek_id === aspek.id && ind.aktif);
      const isOpenSID = aspek.nama_aspek.includes("OpenSID");

      let totalBobot = 0;
      let totalTerbobot = 0;

      for (const ind of aspekInds) {
        const skor = scores[ind.id] ?? 0;
        totalBobot += ind.bobot;
        totalTerbobot += skor * ind.bobot;
      }

      if (isOpenSID) {
        for (const ind of indikatorOpenSIDData.filter((i) => i.aktif)) {
          const skor = scores[ind.id] ?? 0;
          totalBobot += ind.bobot_tambahan;
          totalTerbobot += skor * ind.bobot_tambahan;
        }
      }

      const aspekSkor = totalBobot > 0 ? totalTerbobot / totalBobot : 0;
      totalSkor += aspekSkor * (aspek.bobot_persen / 100);
    }
    return Math.round(totalSkor * 10) / 10;
  };

  const total = calculateTotal();
  const klasifikasi = getKlasifikasi(total);

  const handleSave = () => {
    setSaved(true);
    // In real app, this would call Supabase
  };

  if (!desa) {
    return <div className="empty-state">Desa tidak ditemukan</div>;
  }

  const aspekColors: Record<string, string> = {
    "aspek-1": "#3b82f6",
    "aspek-2": "#10b981",
    "aspek-3": "#f59e0b",
    "aspek-4": "#8b5cf6",
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Link href="/penilaian" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Kembali
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Penilaian: {desa.nama_desa}</h1>
          <p className="page-subtitle">
            Kec. {kec?.nama_kecamatan} • {desa.url_website}
          </p>
        </div>

        {/* Live Score */}
        <div className="card" style={{
          display: "flex", alignItems: "center", gap: 16, padding: "12px 20px",
          background: `${getKlasifikasiColor(klasifikasi)}10`,
          borderColor: `${getKlasifikasiColor(klasifikasi)}30`,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 2 }}>TOTAL SKOR</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: getKlasifikasiColor(klasifikasi), lineHeight: 1 }}>
              {total}
            </div>
          </div>
          <div>
            <span className={`badge badge-${klasifikasi.toLowerCase().replace(/ /g, "-")}`} style={{ fontSize: 13 }}>
              {klasifikasi}
            </span>
          </div>
        </div>
      </div>

      {/* Scoring Form per Aspek */}
      {aspekData.map((aspek) => {
        const aspekInds = indikatorData.filter((ind) => ind.aspek_id === aspek.id && ind.aktif);
        const isOpenSID = aspek.nama_aspek.includes("OpenSID");

        return (
          <div key={aspek.id} className="card" style={{ marginBottom: 16, overflow: "hidden", position: "relative" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, width: 4, bottom: 0,
              background: aspekColors[aspek.id],
            }} />
            <div style={{ paddingLeft: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: aspekColors[aspek.id] }}>
                  {aspek.nama_aspek}
                </h3>
                <span className="badge" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                  Bobot: {aspek.bobot_persen}%
                </span>
              </div>

              {aspekInds.map((ind) => (
                <div key={ind.id} style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 1fr",
                  gap: 12,
                  alignItems: "start",
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>
                      <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-geist-mono)", marginRight: 8 }}>
                        {ind.kode}
                      </span>
                      {ind.nama_indikator}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
                      {ind.deskripsi}
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Skor (0-100)</label>
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      max={100}
                      value={scores[ind.id] ?? ""}
                      onChange={(e) => handleScoreChange(ind.id, parseInt(e.target.value) || 0)}
                      placeholder="0"
                      style={{ textAlign: "center" }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Catatan</label>
                    <input
                      type="text"
                      className="form-input"
                      value={notes[ind.id] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [ind.id]: e.target.value }))}
                      placeholder="Catatan..."
                    />
                  </div>
                </div>
              ))}

              {/* OpenSID extra indicators */}
              {isOpenSID && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, color: aspekColors[aspek.id], marginTop: 16, marginBottom: 8 }}>
                    Indikator Tambahan OpenSID
                  </div>
                  {indikatorOpenSIDData.filter((i) => i.aktif).map((ind) => (
                    <div key={ind.id} style={{
                      padding: "12px 0",
                      borderBottom: "1px solid var(--border)",
                      display: "grid",
                      gridTemplateColumns: "1fr 120px 1fr",
                      gap: 12,
                      alignItems: "start",
                    }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>
                          <span style={{ color: "#f59e0b", fontFamily: "var(--font-geist-mono)", marginRight: 8 }}>
                            {ind.kode}
                          </span>
                          {ind.nama_indikator}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
                          {ind.deskripsi}
                        </div>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Skor (0-100)</label>
                        <input
                          type="number"
                          className="form-input"
                          min={0}
                          max={100}
                          value={scores[ind.id] ?? ""}
                          onChange={(e) => handleScoreChange(ind.id, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          style={{ textAlign: "center" }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Catatan</label>
                        <input
                          type="text"
                          className="form-input"
                          value={notes[ind.id] ?? ""}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [ind.id]: e.target.value }))}
                          placeholder="Catatan..."
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Save Button */}
      <div style={{
        position: "sticky", bottom: 0, padding: "16px 0",
        background: "var(--background)",
        borderTop: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 8,
      }}>
        <div style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
          Total Skor: <strong style={{ color: getKlasifikasiColor(klasifikasi), fontSize: 18 }}>{total}</strong> — {klasifikasi}
        </div>
        <button className="btn btn-primary" onClick={handleSave} style={{ padding: "10px 24px" }}>
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? "Tersimpan!" : "Simpan Penilaian"}
        </button>
      </div>
    </div>
  );
}
