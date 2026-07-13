import type { Klasifikasi, Penilaian, MasterIndikator, MasterIndikatorOpenSID, MasterAspek, HasilEvaluasi } from "./types";
import { generateId } from "./utils";

/**
 * Scoring Engine — Monev OpenSID
 *
 * Calculates evaluation scores per village based on:
 * 1. Score per indicator (0–100)
 * 2. Weighted by indicator weight within its aspect
 * 3. Aggregated by aspect weight percentage
 * 4. Final score 0–100 → classification
 */

// Classification thresholds
const KLASIFIKASI_RANGES: { min: number; max: number; label: Klasifikasi }[] = [
  { min: 85, max: 100, label: "Sangat Aktif" },
  { min: 70, max: 84, label: "Aktif" },
  { min: 55, max: 69, label: "Cukup Aktif" },
  { min: 40, max: 54, label: "Kurang Aktif" },
  { min: 0, max: 39, label: "Tidak Aktif" },
];

export function getKlasifikasi(totalSkor: number): Klasifikasi {
  for (const range of KLASIFIKASI_RANGES) {
    if (totalSkor >= range.min && totalSkor <= range.max) {
      return range.label;
    }
  }
  return "Tidak Aktif";
}

export function getKlasifikasiColor(klasifikasi: Klasifikasi): string {
  switch (klasifikasi) {
    case "Sangat Aktif":
      return "#10b981";
    case "Aktif":
      return "#3b82f6";
    case "Cukup Aktif":
      return "#f59e0b";
    case "Kurang Aktif":
      return "#f97316";
    case "Tidak Aktif":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

export function getKlasifikasiColorClass(klasifikasi: Klasifikasi): string {
  switch (klasifikasi) {
    case "Sangat Aktif":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "Aktif":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "Cukup Aktif":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "Kurang Aktif":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "Tidak Aktif":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

/**
 * Calculate score per aspect for a given village+period
 */
export function calculateSkorPerAspek(
  penilaianDesa: Penilaian[],
  indikatorUmum: MasterIndikator[],
  indikatorOpenSID: MasterIndikatorOpenSID[],
  aspekList: MasterAspek[]
): Record<string, number> {
  const skorPerAspek: Record<string, number> = {};

  for (const aspek of aspekList) {
    // Get indicators for this aspect (umum only, opensid contributes to its own aspect)
    const indikatorAspek = indikatorUmum.filter(
      (ind) => ind.aspek_id === aspek.id && ind.aktif
    );

    // For "Pemanfaatan OpenSID" aspect, include opensid indicators too
    const isOpenSIDAspek = aspek.nama_aspek.includes("OpenSID");

    let totalBobot = 0;
    let totalSkorTerbobot = 0;

    // Calculate for general indicators
    for (const ind of indikatorAspek) {
      const penilaian = penilaianDesa.find(
        (p) => p.indikator_id === ind.id && p.sumber_indikator === "umum"
      );
      const skor = penilaian?.skor ?? 0;
      totalBobot += ind.bobot;
      totalSkorTerbobot += skor * ind.bobot;
    }

    // Add OpenSID indicators if this is the OpenSID aspect
    if (isOpenSIDAspek) {
      for (const ind of indikatorOpenSID.filter((i) => i.aktif)) {
        const penilaian = penilaianDesa.find(
          (p) =>
            p.indikator_id === ind.id && p.sumber_indikator === "opensid"
        );
        const skor = penilaian?.skor ?? 0;
        totalBobot += ind.bobot_tambahan;
        totalSkorTerbobot += skor * ind.bobot_tambahan;
      }
    }

    // Weighted average for this aspect (0-100)
    skorPerAspek[aspek.id] =
      totalBobot > 0 ? totalSkorTerbobot / totalBobot : 0;
  }

  return skorPerAspek;
}

/**
 * Calculate total score from aspect scores × aspect weights
 */
export function calculateTotalSkor(
  skorPerAspek: Record<string, number>,
  aspekList: MasterAspek[]
): number {
  let totalSkor = 0;

  for (const aspek of aspekList) {
    const skorAspek = skorPerAspek[aspek.id] ?? 0;
    totalSkor += skorAspek * (aspek.bobot_persen / 100);
  }

  return Math.round(totalSkor * 10) / 10;
}

/**
 * Generate full evaluation result for a village+period
 */
export function generateHasilEvaluasi(
  desaId: string,
  periodeId: string,
  penilaianDesa: Penilaian[],
  indikatorUmum: MasterIndikator[],
  indikatorOpenSID: MasterIndikatorOpenSID[],
  aspekList: MasterAspek[]
): HasilEvaluasi {
  const skorPerAspek = calculateSkorPerAspek(
    penilaianDesa,
    indikatorUmum,
    indikatorOpenSID,
    aspekList
  );
  const totalSkor = calculateTotalSkor(skorPerAspek, aspekList);
  const klasifikasi = getKlasifikasi(totalSkor);

  return {
    id: generateId(),
    desa_id: desaId,
    periode_id: periodeId,
    total_skor: totalSkor,
    klasifikasi,
    skor_per_aspek: skorPerAspek,
    dihitung_pada: new Date().toISOString(),
  };
}
