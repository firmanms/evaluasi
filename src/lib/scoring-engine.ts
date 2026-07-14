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
 *
 * Skor per aspek dihitung murni dari indikator umum yang ter-assign
 * ke masing-masing aspek (berdasarkan aspek_id).
 * Skor dinormalisasi ke 0-100: (total skor / total bobot maksimal) × 100
 * Sehingga jika semua indikator diisi penuh, skor aspek = 100.
 * bobot_tambahan dari indikator OpenSID belum digunakan.
 */
export function calculateSkorPerAspek(
  penilaianDesa: Penilaian[],
  indikatorUmum: MasterIndikator[],
  _indikatorOpenSID: MasterIndikatorOpenSID[],
  aspekList: MasterAspek[]
): Record<string, number> {
  const skorPerAspek: Record<string, number> = {};

  for (const aspek of aspekList) {
    // Get all active indicators assigned to this aspect
    const indikatorAspek = indikatorUmum.filter(
      (ind) => ind.aspek_id === aspek.id && ind.aktif
    );

    let totalSkor = 0;
    let totalBobotMaks = 0;

    for (const ind of indikatorAspek) {
      const penilaian = penilaianDesa.find(
        (p) => p.indikator_id === ind.id
      );
      const skor = Number(penilaian?.skor) || 0;
      const bobot = Number(ind.bobot) || 0;
      totalSkor += skor;
      totalBobotMaks += bobot;
    }

    // Normalisasi ke 0-100: berapa persen dari bobot maks yang tercapai
    skorPerAspek[aspek.id] =
      totalBobotMaks > 0 ? (totalSkor / totalBobotMaks) * 100 : 0;
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
    const skorAspek = Number(skorPerAspek[aspek.id]) || 0;
    const bobotPersen = Number(aspek.bobot_persen) || 0;
    totalSkor += skorAspek * (bobotPersen / 100);
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
