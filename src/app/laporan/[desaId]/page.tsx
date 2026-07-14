"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, AlertTriangle, Award, BarChart3, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getKlasifikasi, getKlasifikasiColor, calculateSkorPerAspek, calculateTotalSkor } from "@/lib/scoring-engine";
import type { Klasifikasi } from "@/lib/types";

export default function RaporDesaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const desaId = params.desaId as string;
  const periodeId = searchParams.get("periode") || "";
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [desa, setDesa] = useState<any>(null);
  const [periode, setPeriode] = useState<any>(null);
  const [aspekList, setAspekList] = useState<any[]>([]);
  const [indikatorUmum, setIndikatorUmum] = useState<any[]>([]);
  const [penilaianList, setPenilaianList] = useState<any[]>([]);
  const [hasilEvaluasi, setHasilEvaluasi] = useState<any>(null);
  const [profilWebsite, setProfilWebsite] = useState<any>(null);

  useEffect(() => {
    if (desaId && periodeId) {
      fetchData();
    }
  }, [desaId, periodeId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [desaRes, periodeRes, aspekRes, indRes, penilaianRes, hasilRes, websiteRes] = await Promise.all([
        supabase.from("desa").select("*, kecamatan(nama_kecamatan)").eq("id", desaId).single(),
        supabase.from("periode_evaluasi").select("*").eq("id", periodeId).single(),
        supabase.from("master_aspek").select("*").order("nama_aspek"),
        supabase.from("master_indikator").select("*").eq("aktif", true).order("kode"),
        supabase.from("penilaian").select("*").eq("desa_id", desaId).eq("periode_id", periodeId),
        supabase.from("hasil_evaluasi").select("*").eq("desa_id", desaId).eq("periode_id", periodeId).single(),
        supabase.from("master_website").select("*, master_server:server_id(nama_server, lokasi_server)").eq("desa_id", desaId).single(),
      ]);

      if (desaRes.error) throw desaRes.error;
      if (periodeRes.error) throw periodeRes.error;

      setDesa(desaRes.data);
      setPeriode(periodeRes.data);
      setAspekList(aspekRes.data || []);
      setIndikatorUmum(indRes.data || []);
      setPenilaianList(penilaianRes.data || []);
      setHasilEvaluasi(hasilRes.data || null);
      setProfilWebsite(websiteRes.data || null);
    } catch (err: any) {
      console.error("Load error:", err);
      setError("Gagal memuat data rapor.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPDF() {
    window.print();
  }

  // Compute scores from penilaian data
  const skorPerAspek = aspekList.length > 0
    ? calculateSkorPerAspek(penilaianList as any, indikatorUmum, [], aspekList)
    : {};
  const totalSkor = aspekList.length > 0
    ? calculateTotalSkor(skorPerAspek, aspekList)
    : 0;
  const klasifikasi = getKlasifikasi(totalSkor);
  const klasifikasiColor = getKlasifikasiColor(klasifikasi);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", color: "var(--muted-foreground)" }}>
        <Loader2 className="animate-spin" size={32} style={{ marginBottom: 12 }} />
        <p>Memuat rapor evaluasi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in" style={{ padding: 40, textAlign: "center" }}>
        <AlertTriangle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
        <p style={{ color: "#ef4444" }}>{error}</p>
        <Link href="/laporan" className="btn btn-secondary" style={{ marginTop: 16 }}>
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .rapor-printable, .rapor-printable * { visibility: visible; }
          .rapor-printable { 
            position: absolute; left: 0; top: 0; width: 100%; 
            padding: 20px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      <div className="animate-fade-in no-print">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/laporan" className="btn-ghost" style={{ padding: "8px", borderRadius: "50%" }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="page-title" style={{ marginBottom: 4 }}>Rapor Evaluasi</h1>
              <p className="page-subtitle">{desa?.nama_desa} — {periode?.nama_periode}</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleDownloadPDF}>
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>

      {/* Printable Rapor Content */}
      <div ref={printRef} className="rapor-printable animate-fade-in">

        {/* Header Rapor */}
        <div className="card" style={{ marginBottom: 24, padding: "32px", textAlign: "center", background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", color: "#fff", border: "none" }}>
          <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4, opacity: 0.8 }}>
            Pemerintah Kabupaten Bandung
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0" }}>
            Rapor Evaluasi Website Desa
          </h2>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            Periode: {periode?.nama_periode}
          </div>
        </div>

        {/* Info Desa */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 1, fontSize: 12 }}>
            Informasi Desa
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Desa/Kelurahan</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{desa?.nama_desa}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Kecamatan</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{desa?.kecamatan?.nama_kecamatan}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>URL Website</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#3b82f6" }}>{desa?.url_website || "-"}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Periode Evaluasi</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {new Date(periode?.tanggal_mulai).toLocaleDateString("id-ID")} — {new Date(periode?.tanggal_selesai).toLocaleDateString("id-ID")}
              </div>
            </div>
          </div>
        </div>

        {/* Profil Website */}
        {profilWebsite && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 16, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 1, fontSize: 12 }}>
              Profil Pengelolaan Website
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Operator</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{profilWebsite.operator || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>No. WhatsApp</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{profilWebsite.no_wa || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Email</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{profilWebsite.email || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Tahun Mulai</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{profilWebsite.tahun_mulai_gunakan || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Jumlah Operator</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{profilWebsite.jumlah_operator || "-"} orang</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Pengelola Website</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{profilWebsite.pengelola_website || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Perangkat</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{profilWebsite.perangkat_digunakan || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Kecepatan Internet</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{profilWebsite.kecepatan_internet || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Frekuensi Update</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{profilWebsite.frekuensi_update || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Versi OpenSID</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{profilWebsite.versi || "-"} ({profilWebsite.jenis_versi || "-"})</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Status Website</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: profilWebsite.status_website === "Aktif" ? "#10b981" : "#ef4444" }}>
                  {profilWebsite.status_website || "-"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Server</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {profilWebsite.master_server?.nama_server || "-"} ({profilWebsite.master_server?.lokasi_server || "-"})
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skor Total */}
        <div className="card" style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: `conic-gradient(${klasifikasiColor} ${totalSkor * 3.6}deg, #e5e7eb ${totalSkor * 3.6}deg)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "var(--card)", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: klasifikasiColor }}>{totalSkor}</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Total Skor Evaluasi</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800 }}>{totalSkor}</span>
              <span style={{ fontSize: 16, color: "var(--muted-foreground)" }}>/ 100</span>
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 16px", borderRadius: 20,
              background: `${klasifikasiColor}15`, color: klasifikasiColor,
              fontWeight: 700, fontSize: 14,
            }}>
              <Award size={16} />
              {klasifikasi}
            </div>
          </div>
        </div>

        {/* Skor Per Aspek */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 16, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 1 }}>
            Skor Per Aspek
          </h3>
          <div style={{ display: "grid", gap: 16 }}>
            {aspekList.map((aspek) => {
              const skor = Math.round(skorPerAspek[aspek.id] || 0);
              const bobotPersen = Number(aspek.bobot_persen) || 0;
              const kontribusi = Math.round(skor * bobotPersen / 100 * 10) / 10;
              const barColor = getKlasifikasiColor(getKlasifikasi(skor));
              return (
                <div key={aspek.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{aspek.nama_aspek}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Bobot: {bobotPersen}%</span>
                      <span style={{ fontWeight: 700, color: barColor }}>{skor}</span>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--muted)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4,
                      width: `${skor}%`,
                      background: barColor,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
                    Kontribusi ke skor total: {kontribusi} poin
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Per Aspek */}
        {aspekList.map((aspek) => {
          const indikators = indikatorUmum
            .filter(ind => ind.aspek_id === aspek.id)
            .sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true, sensitivity: "base" }));

          if (indikators.length === 0) return null;
          const aspekSkor = Math.round(skorPerAspek[aspek.id] || 0);

          return (
            <div key={aspek.id} className="card" style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}>
              <div style={{
                padding: "16px 24px",
                background: "rgba(0,0,0,0.02)",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{aspek.nama_aspek}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="badge" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                    Skor: {aspekSkor}
                  </span>
                  <span className="badge">Bobot: {aspek.bobot_persen}%</span>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>Kode</th>
                      <th>Indikator</th>
                      <th style={{ width: 80, textAlign: "center" }}>Bobot</th>
                      <th style={{ width: 80, textAlign: "center" }}>Skor</th>
                      <th style={{ width: 80, textAlign: "center" }}>Status</th>
                      <th>Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indikators.map((ind) => {
                      const penilaian = penilaianList.find(p => p.indikator_id === ind.id);
                      const skor = Number(penilaian?.skor) || 0;
                      const bobot = Number(ind.bobot) || 0;
                      const persen = bobot > 0 ? Math.round((skor / bobot) * 100) : 0;
                      const catatan = penilaian?.catatan || "";

                      return (
                        <tr key={ind.id}>
                          <td>
                            <span className="badge" style={{ background: "var(--muted)" }}>{ind.kode}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500, marginBottom: 2 }}>{ind.nama_indikator}</div>
                            {ind.deskripsi && (
                              <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.4 }}>{ind.deskripsi}</div>
                            )}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>{bobot}</td>
                          <td style={{ textAlign: "center", fontWeight: 700, color: persen >= 70 ? "#10b981" : persen >= 40 ? "#f59e0b" : "#ef4444" }}>
                            {skor}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {persen >= 70 ? (
                              <CheckCircle2 size={18} color="#10b981" />
                            ) : persen >= 40 ? (
                              <BarChart3 size={18} color="#f59e0b" />
                            ) : (
                              <XCircle size={18} color="#ef4444" />
                            )}
                          </td>
                          <td style={{ fontSize: 13, color: "var(--muted-foreground)", maxWidth: 200 }}>
                            {catatan || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div style={{ textAlign: "center", color: "var(--muted-foreground)", fontSize: 12, padding: "24px 0", borderTop: "1px solid var(--border)" }}>
          Digenerate pada {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} •
          Sistem Monitoring & Evaluasi Website Desa — Kabupaten Bandung
        </div>
      </div>
    </>
  );
}
