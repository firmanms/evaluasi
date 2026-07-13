// ============================================================
// Monev OpenSID — Type Definitions
// ============================================================

export type JenisDesa = "desa" | "kelurahan";

export type StatusPeriode = "draft" | "berjalan" | "selesai";

export type Klasifikasi =
  | "Sangat Aktif"
  | "Aktif"
  | "Cukup Aktif"
  | "Kurang Aktif"
  | "Tidak Aktif";

export type SumberIndikator = "umum" | "opensid";

export type RoleUser =
  | "super_admin"
  | "admin_kecamatan"
  | "operator_desa"
  | "viewer";

export type StatusKendala = "baru" | "diproses" | "selesai";

// ---- Master Data ----

export interface Kecamatan {
  id: string;
  nama_kecamatan: string;
}

export interface Desa {
  id: string;
  nama_desa: string;
  jenis: JenisDesa;
  kecamatan_id: string;
  url_website: string;
  status_aktif: boolean;
  created_at: string;
}

export interface MasterWebsite {
  id: string;
  desa_id: string;
  operator: string;
  no_wa: string;
  email: string;
  tahun_mulai_gunakan: number;
  jumlah_operator: number;
  perangkat_digunakan: string;
  kecepatan_internet: string;
  pengelola_website: string;
  frekuensi_update: string;
  kendala: string;
  saran: string;
  updated_at: string;
}

export interface MasterAspek {
  id: string;
  nama_aspek: string;
  bobot_persen: number;
}

export interface MasterIndikator {
  id: string;
  kode: string;
  nama_indikator: string;
  aspek_id: string;
  bobot: number;
  deskripsi: string;
  aktif: boolean;
}

export interface MasterIndikatorOpenSID {
  id: string;
  kode: string;
  nama_indikator: string;
  bobot_tambahan: number;
  deskripsi: string;
  aktif: boolean;
}

export interface PeriodeEvaluasi {
  id: string;
  nama_periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: StatusPeriode;
}

// ---- Transaksi ----

export interface Penilaian {
  id: string;
  desa_id: string;
  periode_id: string;
  indikator_id: string;
  sumber_indikator: SumberIndikator;
  skor: number; // 0-100
  catatan: string;
  bukti_file_url: string | null;
  dinilai_oleh: string;
  dinilai_pada: string;
}

export interface HasilEvaluasi {
  id: string;
  desa_id: string;
  periode_id: string;
  total_skor: number;
  klasifikasi: Klasifikasi;
  skor_per_aspek: Record<string, number>;
  dihitung_pada: string;
}

export interface LogMonitoring {
  id: string;
  desa_id: string;
  tanggal_cek: string;
  http_status: number;
  https_aktif: boolean;
  response_time_ms: number;
  keterangan: string;
}

export interface Kendala {
  id: string;
  desa_id: string;
  periode_id: string;
  deskripsi: string;
  status: StatusKendala;
  tindak_lanjut: string;
  dilaporkan_pada: string;
  diupdate_pada: string;
}

export interface UserApp {
  id: string;
  nama: string;
  email: string;
  role: RoleUser;
  desa_id: string | null;
  kecamatan_id: string | null;
}

// ---- UI/Display helpers ----

export interface DesaWithKecamatan extends Desa {
  nama_kecamatan: string;
}

export interface HasilEvaluasiDisplay extends HasilEvaluasi {
  nama_desa: string;
  nama_kecamatan: string;
  url_website: string;
}

export interface DashboardStats {
  totalDesa: number;
  websiteAktif: number;
  websiteTidakAktif: number;
  rataRataSkor: number;
  desaDinilai: number;
  desaBelumDinilai: number;
  distribusiKlasifikasi: Record<Klasifikasi, number>;
  topKecamatan: { nama: string; skor: number }[];
  bottomKecamatan: { nama: string; skor: number }[];
  trendData: { periode: string; skor: number }[];
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  children?: NavItem[];
  roles?: RoleUser[];
}
