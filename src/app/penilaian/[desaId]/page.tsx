"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, AlertTriangle, Loader2, CheckCircle2, ChevronDown, ChevronRight, Calculator } from "lucide-react";
import Link from "next/link";
import { calculateSkorPerAspek, calculateTotalSkor, getKlasifikasi, getKlasifikasiColor } from "@/lib/scoring-engine";
import type { Klasifikasi } from "@/lib/types";

export default function PenilaianFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const desaId = params.desaId as string;
  const periodeId = searchParams.get("periode");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [desa, setDesa] = useState<any>(null);
  const [periode, setPeriode] = useState<any>(null);
  const [aspekList, setAspekList] = useState<any[]>([]);
  const [indikatorUmum, setIndikatorUmum] = useState<any[]>([]);
  const [indikatorOpenSID, setIndikatorOpenSID] = useState<any[]>([]);
  
  const [answers, setAnswers] = useState<Record<string, { skor: number; catatan: string }>>({});
  
  // State for live calculation
  const [liveSkor, setLiveSkor] = useState(0);
  const [liveSkorPerAspek, setLiveSkorPerAspek] = useState<Record<string, number>>({});
  const [liveKlasifikasi, setLiveKlasifikasi] = useState("Tidak Aktif");

  useEffect(() => {
    if (desaId && periodeId) {
      loadData();
    } else {
      setError("Parameter tidak lengkap (desaId atau periode hilang).");
      setLoading(false);
    }
  }, [desaId, periodeId]);

  // Recalculate live score whenever answers change
  useEffect(() => {
    if (!loading && aspekList.length > 0) {
      calculateLive();
    }
  }, [answers, loading]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      // Fetch references
      const [
        desaRes,
        periodeRes,
        aspekRes,
        indUmumRes,
        indOSRes,
        penilaianRes
      ] = await Promise.all([
        supabase.from("desa").select("*, kecamatan(nama_kecamatan)").eq("id", desaId).single(),
        supabase.from("periode_evaluasi").select("*").eq("id", periodeId).single(),
        supabase.from("master_aspek").select("*").order("nama_aspek"),
        supabase.from("master_indikator").select("*").eq("aktif", true),
        supabase.from("master_indikator_opensid").select("*").eq("aktif", true),
        supabase.from("penilaian").select("*").eq("desa_id", desaId).eq("periode_id", periodeId)
      ]);

      if (desaRes.error) throw desaRes.error;
      if (periodeRes.error) throw periodeRes.error;

      setDesa(desaRes.data);
      setPeriode(periodeRes.data);
      setAspekList(aspekRes.data || []);
      setIndikatorUmum(indUmumRes.data || []);
      setIndikatorOpenSID(indOSRes.data || []);

      // Load existing answers
      const initAnswers: Record<string, { skor: number; catatan: string }> = {};
      
      penilaianRes.data?.forEach((p) => {
        const key = `${p.sumber_indikator}_${p.indikator_id}`;
        initAnswers[key] = {
          skor: Number(p.skor) || 0,
          catatan: p.catatan || ""
        };
      });

      setAnswers(initAnswers);

    } catch (err: any) {
      console.error("Load error:", err);
      setError("Gagal memuat data formulir penilaian.");
    } finally {
      setLoading(false);
    }
  }

  function handleSkorChange(sumber: string, indikatorId: string, value: number) {
    const key = `${sumber}_${indikatorId}`;
    setAnswers((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        skor: value,
      }
    }));
  }

  function handleCatatanChange(sumber: string, indikatorId: string, value: string) {
    const key = `${sumber}_${indikatorId}`;
    setAnswers((prev) => ({
      ...prev,
      [key]: {
        skor: prev[key]?.skor ?? 0,
        catatan: value,
      }
    }));
  }

  function calculateLive() {
    // Reconstruct into format expected by scoring-engine
    const penilaianMock = Object.entries(answers).map(([key, val]) => {
      const [sumber, id] = key.split("_");
      return {
        indikator_id: id,
        sumber_indikator: sumber,
        skor: val.skor
      } as any;
    });

    const perAspek = calculateSkorPerAspek(penilaianMock, indikatorUmum, indikatorOpenSID, aspekList);
    const total = calculateTotalSkor(perAspek, aspekList);
    setLiveSkorPerAspek(perAspek);
    setLiveSkor(total);
    setLiveKlasifikasi(getKlasifikasi(total));
  }

  async function handleSave(status: "draft" | "selesai") {
    if (!desaId || !periodeId) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // 1. Prepare Upsert array for penilaian
      const upsertPayload = Object.entries(answers).map(([key, val]) => {
        const [sumber, id] = key.split("_");
        return {
          desa_id: desaId,
          periode_id: periodeId,
          indikator_id: id,
          sumber_indikator: sumber,
          skor: val.skor,
          catatan: val.catatan,
          // dinilai_oleh: we'd put auth.uid() if rls enabled
        };
      });

      if (upsertPayload.length > 0) {
        const { error: upsertErr } = await supabase
          .from("penilaian")
          .upsert(upsertPayload, { onConflict: "desa_id,periode_id,indikator_id,sumber_indikator" });
        if (upsertErr) throw upsertErr;
      }

      // 2. Prepare Hasil Evaluasi recalculation
      const perAspek = calculateSkorPerAspek(upsertPayload as any, indikatorUmum, indikatorOpenSID, aspekList);
      const total = calculateTotalSkor(perAspek, aspekList);
      const klasifikasi = getKlasifikasi(total);

      const hasilPayload = {
        desa_id: desaId,
        periode_id: periodeId,
        total_skor: total,
        klasifikasi,
        skor_per_aspek: perAspek,
        status,
        dihitung_pada: new Date().toISOString()
      };

      const { error: hasilErr } = await supabase
        .from("hasil_evaluasi")
        .upsert(hasilPayload, { onConflict: "desa_id,periode_id" });
      
      if (hasilErr) throw hasilErr;

      setSuccess(`Berhasil menyimpan penilaian (${status === 'selesai' ? 'Selesai' : 'Draft'}).`);
      
      setTimeout(() => {
        router.push("/penilaian");
      }, 1500);

    } catch (err: any) {
      console.error("Save error:", err);
      setError("Terjadi kesalahan saat menyimpan penilaian.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", color: "var(--muted-foreground)" }}>
        <Loader2 className="animate-spin" size={32} style={{ marginBottom: 12 }} />
        <p>Memuat formulir indikator...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 100 }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Link href="/penilaian" className="btn-ghost" style={{ padding: "8px", borderRadius: "50%" }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Input Penilaian</h1>
          </div>
          <p className="page-subtitle" style={{ marginLeft: 44 }}>
            Form evaluasi website dan pemanfaatan OpenSID
          </p>
        </div>
        
        {/* Floating Live Score Widget */}
        <div className="card" style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 16, background: "var(--background)", border: "2px solid var(--border)" }}>
          <Calculator size={20} style={{ color: "var(--muted-foreground)" }} />
          <div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Estimasi Skor</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700 }}>{liveSkor}</span>
              <span className="badge" style={{ background: getKlasifikasiColor(liveKlasifikasi as Klasifikasi) + "20", color: getKlasifikasiColor(liveKlasifikasi as Klasifikasi) }}>
                {liveKlasifikasi}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 24 }}>
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Target Info */}
      <div className="card" style={{ marginBottom: 24, display: "flex", gap: 40 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Desa/Kelurahan</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{desa?.nama_desa}</div>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Kec. {desa?.kecamatan?.nama_kecamatan}</div>
        </div>
        <div style={{ width: "1px", background: "var(--border)" }} />
        <div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>Periode Evaluasi</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{periode?.nama_periode}</div>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            {new Date(periode?.tanggal_mulai).toLocaleDateString("id-ID")} - {new Date(periode?.tanggal_selesai).toLocaleDateString("id-ID")}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {aspekList.map((aspek) => {
          // Group indicators per aspect
          const isOpenSID = aspek.nama_aspek.toLowerCase().includes("opensid");
          const indUmumFilter = indikatorUmum.filter(i => i.aspek_id === aspek.id);
          const hasContent = indUmumFilter.length > 0 || (isOpenSID && indikatorOpenSID.length > 0);

          if (!hasContent) return null;

          const skorAspek = Math.round(liveSkorPerAspek[aspek.id] || 0);

          return (
            <div key={aspek.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <div style={{ padding: "16px 24px", background: "rgba(0,0,0,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{aspek.nama_aspek}</h3>
                  <span className="badge" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                    Skor: {skorAspek}
                  </span>
                </div>
                <span className="badge">Bobot: {aspek.bobot_persen}%</span>
              </div>
              
              <div style={{ padding: "0" }}>
                {/* Indikator Umum */}
                {indUmumFilter.map((ind, i) => (
                  <IndicatorRow 
                    key={ind.id} 
                    ind={ind} 
                    sumber="umum" 
                    value={answers[`umum_${ind.id}`]?.skor ?? 0}
                    catatan={answers[`umum_${ind.id}`]?.catatan ?? ""}
                    onChangeSkor={(val: number) => handleSkorChange("umum", ind.id, val)}
                    onChangeCatatan={(val: string) => handleCatatanChange("umum", ind.id, val)}
                    isLast={i === indUmumFilter.length - 1 && (!isOpenSID || indikatorOpenSID.length === 0)}
                  />
                ))}

                {/* Indikator Khusus OpenSID */}
                {isOpenSID && indikatorOpenSID.length > 0 && (
                  <div style={{ padding: "12px 24px", background: "rgba(16, 185, 129, 0.05)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600, color: "#059669" }}>
                    Indikator Khusus Pemanfaatan OpenSID (Bobot Tambahan)
                  </div>
                )}
                
                {isOpenSID && indikatorOpenSID.map((ind, i) => (
                  <IndicatorRow 
                    key={ind.id} 
                    ind={ind} 
                    sumber="opensid" 
                    value={answers[`opensid_${ind.id}`]?.skor ?? 0}
                    catatan={answers[`opensid_${ind.id}`]?.catatan ?? ""}
                    onChangeSkor={(val: number) => handleSkorChange("opensid", ind.id, val)}
                    onChangeCatatan={(val: string) => handleCatatanChange("opensid", ind.id, val)}
                    isLast={i === indikatorOpenSID.length - 1}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 260,
        right: 0,
        padding: "16px 32px",
        background: "var(--card)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
        boxShadow: "0 -4px 12px rgba(0,0,0,0.05)"
      }}>
        <div style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
          Pastikan semua bukti atau catatan relevan telah diisi.
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleSave("draft")}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Simpan Draft
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => handleSave("selesai")}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            Selesai & Kunci Penilaian
          </button>
        </div>
      </div>
    </div>
  );
}

function IndicatorRow({ 
  ind, 
  sumber, 
  value, 
  catatan, 
  onChangeSkor, 
  onChangeCatatan, 
  isLast 
}: any) {
  const isPilihan = ind.tipe_jawaban === "pilihan";
  const pilihan = ind.pilihan_jawaban || [];

  return (
    <div style={{ padding: "20px 24px", borderBottom: isLast ? "none" : "1px solid var(--border)", display: "flex", gap: 24 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <span className="badge" style={{ background: "var(--muted)" }}>{ind.kode}</span>
          <span style={{ fontWeight: 500 }}>{ind.nama_indikator}</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 12, lineHeight: 1.5 }}>
          {ind.deskripsi || "Tidak ada deskripsi rinci."}
        </div>
        <input 
          type="text" 
          placeholder="Catatan evaluator / link bukti pendukung..." 
          className="form-input" 
          style={{ width: "100%", fontSize: 13 }}
          value={catatan}
          onChange={(e) => onChangeCatatan(e.target.value)}
        />
      </div>
      
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8, textAlign: "right" }}>
          Penilaian {isPilihan ? "(Pilih Opsi)" : `(0 - ${ind.bobot})`}
        </div>
        
        {isPilihan ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pilihan.map((opt: any, idx: number) => (
              <label 
                key={idx} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "8px 12px", 
                  border: "1px solid var(--border)", 
                  borderRadius: 6,
                  cursor: "pointer",
                  background: value === opt.nilai ? "rgba(59,130,246,0.05)" : "transparent",
                  borderColor: value === opt.nilai ? "#3b82f6" : "var(--border)"
                }}
              >
                <input 
                  type="radio" 
                  name={`opt_${sumber}_${ind.id}`} 
                  value={opt.nilai}
                  checked={value === opt.nilai}
                  onChange={() => onChangeSkor(opt.nilai)}
                  style={{ cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", flex: 1, fontSize: 13 }}>
                  <span>{opt.label}</span>
                  <span style={{ fontWeight: 600, color: "var(--muted-foreground)" }}>({opt.nilai})</span>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input 
                type="range" 
                min="0" 
                max={ind.bobot} 
                step="1"
                style={{ flex: 1 }}
                value={value}
                onChange={(e) => onChangeSkor(Number(e.target.value))}
              />
              <div style={{ 
                width: 44, 
                height: 36, 
                background: "var(--background)", 
                border: "1px solid var(--border)", 
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600
              }}>
                {value}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
              <span>0 (Buruk)</span>
              <span>{ind.bobot} (Sempurna)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
