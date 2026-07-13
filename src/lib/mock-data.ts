import type {
  Kecamatan, Desa, MasterAspek, MasterIndikator, MasterIndikatorOpenSID,
  PeriodeEvaluasi, HasilEvaluasi, LogMonitoring, Kendala, UserApp,
  MasterWebsite, Klasifikasi, DashboardStats,
} from "./types";
import { getKlasifikasi } from "./scoring-engine";

// ========== KECAMATAN (31 Kecamatan Kabupaten Bandung) ==========
export const kecamatanData: Kecamatan[] = [
  { id: "kec-01", nama_kecamatan: "Arjasari" },
  { id: "kec-02", nama_kecamatan: "Baleendah" },
  { id: "kec-03", nama_kecamatan: "Banjaran" },
  { id: "kec-04", nama_kecamatan: "Bojongsoang" },
  { id: "kec-05", nama_kecamatan: "Cangkuang" },
  { id: "kec-06", nama_kecamatan: "Cicalengka" },
  { id: "kec-07", nama_kecamatan: "Cikancung" },
  { id: "kec-08", nama_kecamatan: "Cilengkrang" },
  { id: "kec-09", nama_kecamatan: "Cileunyi" },
  { id: "kec-10", nama_kecamatan: "Cimaung" },
  { id: "kec-11", nama_kecamatan: "Cimenyan" },
  { id: "kec-12", nama_kecamatan: "Ciparay" },
  { id: "kec-13", nama_kecamatan: "Ciwidey" },
  { id: "kec-14", nama_kecamatan: "Dayeuhkolot" },
  { id: "kec-15", nama_kecamatan: "Ibun" },
  { id: "kec-16", nama_kecamatan: "Katapang" },
  { id: "kec-17", nama_kecamatan: "Kertasari" },
  { id: "kec-18", nama_kecamatan: "Kutawaringin" },
  { id: "kec-19", nama_kecamatan: "Majalaya" },
  { id: "kec-20", nama_kecamatan: "Margaasih" },
  { id: "kec-21", nama_kecamatan: "Margahayu" },
  { id: "kec-22", nama_kecamatan: "Nagreg" },
  { id: "kec-23", nama_kecamatan: "Pacet" },
  { id: "kec-24", nama_kecamatan: "Pameungpeuk" },
  { id: "kec-25", nama_kecamatan: "Pangalengan" },
  { id: "kec-26", nama_kecamatan: "Paseh" },
  { id: "kec-27", nama_kecamatan: "Pasirjambu" },
  { id: "kec-28", nama_kecamatan: "Rancabali" },
  { id: "kec-29", nama_kecamatan: "Rancaekek" },
  { id: "kec-30", nama_kecamatan: "Soreang" },
  { id: "kec-31", nama_kecamatan: "Solokanjeruk" },
];

// ========== DESA (Sample 280 desa/kelurahan) ==========
const desaNames: Record<string, string[]> = {
  "kec-01": ["Arjasari", "Batukarut", "Lebakwangi", "Mekarjaya", "Pinggirsari", "Patrolsari", "Rancakole", "Wargaluyu", "Ancolmekar", "Panembong", "Barusari"],
  "kec-02": ["Andir", "Baleendah", "Bojongmalaka", "Jelekong", "Malakasari", "Manggahang", "Nagrak", "Rancamanyar"],
  "kec-03": ["Banjaran", "Ciapus", "Kamasan", "Kiangroke", "Margahurip", "Mekarjaya", "Neglasari", "Pasirmaju", "Sindangpanon", "Tarajusari"],
  "kec-04": ["Bojongsoang", "Buahbatu", "Cipagalo", "Lengkong", "Tegalluar"],
  "kec-05": ["Cangkuang", "Ciluncat", "Nagrak", "Pananjung", "Tanjungsari", "Jatisari", "Citaman"],
  "kec-06": ["Babakan Peuteuy", "Cicalengka Kulon", "Cicalengka Wetan", "Cikuya", "Dampit", "Narawita", "Panenjoan", "Tanjungwangi", "Tenjolaya", "Waluya", "Margaasih", "Sukamaju"],
  "kec-07": ["Cikancung", "Cihanyir", "Hegarmanah", "Mandalasari", "Mekarlaksana", "Srirahayu", "Tanjunglaya", "Ciluluk", "Cikasungka"],
  "kec-08": ["Cipanjalu", "Cilengkrang", "Girimekar", "Jatiendah", "Melatiwangi", "Ciporeat"],
  "kec-09": ["Cibiru Hilir", "Cibiru Wetan", "Cileunyi Kulon", "Cileunyi Wetan", "Cimekar", "Cinunuk"],
  "kec-10": ["Cimaung", "Campakamulya", "Jagabaya", "Malasari", "Mekarsari", "Pasirhuni", "Cipinang", "Pangalengan"],
  "kec-11": ["Cimenyan", "Ciburial", "Mandalamekar", "Mekarsaluyu", "Sindanglaya", "Mekarmanik"],
  "kec-12": ["Bumiwangi", "Cikoneng", "Ciparay", "Mangunkerta", "Mekarsari", "Pakutandang", "Sarimahi", "Sumbersari", "Tegalwaru", "Mekarlaksana", "Ciherang", "Serangmekar", "Haurpugur"],
  "kec-13": ["Ciwidey", "Lebakmuncang", "Nengkelan", "Panyocokan", "Panundaan", "Rawabogo", "Sukawening"],
  "kec-14": ["Citangkil", "Citeureup", "Dayeuhkolot", "Pasawahan", "Sukapura", "Sulaeman"],
  "kec-15": ["Dukuh", "Ibon", "Lampegan", "Laksana", "Mekarwangi", "Neglasari", "Sudi", "Tangsimekar", "Talun", "Soreang"],
  "kec-16": ["Banyusari", "Cilampeni", "Gandasari", "Katapang", "Pangauban", "Sukamukti", "Parungserab"],
  "kec-17": ["Alam Endah", "Cibeureum", "Neglawangi", "Santosa", "Sukapura", "Tarumajaya", "Cikembang"],
  "kec-18": ["Gajahmekar", "Jatisari", "Kopo", "Kutawaringin", "Padasuka", "Pameuntasan", "Sukamulya"],
  "kec-19": ["Bojong", "Biru", "Majakerta", "Majalaya", "Neglasari", "Padamulya", "Panyadap", "Sukamaju", "Sukamukti", "Wangisagara", "Rancajigang"],
  "kec-20": ["Cigondewah Hilir", "Mekar Rahayu", "Margaasih", "Nanjung", "Rahayu"],
  "kec-21": ["Margahayu Selatan", "Margahayu Tengah", "Sayati", "Sukamenak", "Sulaeman"],
  "kec-22": ["Bojong", "Ciaro", "Citaman", "Ganjar Sabar", "Mandalawangi", "Nagreg", "Leles"],
  "kec-23": ["Cipeujeuh", "Cinanggela", "Cisondari", "Mekarjaya", "Mekarsari", "Pangalengan", "Tanjungsari", "Sukamanah", "Girimulya"],
  "kec-24": ["Bojongkunci", "Langensari", "Pameungpeuk", "Rancatungku", "Sukasari", "Pangrumasan"],
  "kec-25": ["Banjarsari", "Lamajang", "Margaluyu", "Margamekar", "Pangalengan", "Pulosari", "Sukaluyu", "Sukamanah", "Tribaktimulya", "Wanasuka", "Warnasari"],
  "kec-26": ["Cipaku", "Drawati", "Karangtunggal", "Mekarpawitan", "Paseh Kaler", "Paseh Kidul", "Sindangpakuon", "Sukamanah", "Cijagra", "Cipedes"],
  "kec-27": ["Cukanggenteng", "Mekarsari", "Mekarjaya", "Cisondari", "Pasirjambu", "Sugihmukti", "Tenjolaya", "Cikoneng"],
  "kec-28": ["Alamendah", "Cipelah", "Indragiri", "Patengan", "Rancabali", "Sugihmukti"],
  "kec-29": ["Bojongsalam", "Cangkuang", "Haurpugur", "Jelegong", "Linggar", "Nanjungmekar", "Padamulya", "Rancaekek Kencana", "Rancaekek Kulon", "Rancaekek Wetan", "Sangiang", "Sukamanah", "Tegalsumedang"],
  "kec-30": ["Cingcin", "Karamatmulya", "Pamekaran", "Parung", "Sarilamping", "Sekarwangi", "Soreang", "Sukajadi", "Sukamulya", "Cibodas"],
  "kec-31": ["Cibodas", "Langensari", "Padamulya", "Panyadap", "Rancakasumba", "Solokanjeruk", "Sukamaju"],
};

function createDesaList(): Desa[] {
  const allDesa: Desa[] = [];
  let counter = 1;
  for (const [kecId, names] of Object.entries(desaNames)) {
    for (const name of names) {
      const isKelurahan = counter <= 10; // First 10 are kelurahan
      allDesa.push({
        id: `desa-${String(counter).padStart(3, "0")}`,
        nama_desa: name,
        jenis: isKelurahan ? "kelurahan" : "desa",
        kecamatan_id: kecId,
        url_website: `https://${name.toLowerCase().replace(/\s+/g, "")}.desa.id`,
        status_aktif: Math.random() > 0.08,
        created_at: "2024-01-01T00:00:00Z",
      });
      counter++;
    }
  }
  return allDesa;
}

export const desaData: Desa[] = createDesaList();

// ========== ASPEK (4 aspek penilaian) ==========
export const aspekData: MasterAspek[] = [
  { id: "aspek-1", nama_aspek: "Ketersediaan Layanan", bobot_persen: 20 },
  { id: "aspek-2", nama_aspek: "Konten & Informasi Publik", bobot_persen: 35 },
  { id: "aspek-3", nama_aspek: "Pemanfaatan OpenSID", bobot_persen: 30 },
  { id: "aspek-4", nama_aspek: "Tata Kelola", bobot_persen: 15 },
];

// ========== INDIKATOR UMUM ==========
export const indikatorData: MasterIndikator[] = [
  // Ketersediaan Layanan (aspek-1)
  { id: "ind-01", kode: "KL.01", nama_indikator: "Website dapat diakses (HTTP 200)", aspek_id: "aspek-1", bobot: 30, deskripsi: "Website desa dapat diakses dan menampilkan halaman utama tanpa error", aktif: true },
  { id: "ind-02", kode: "KL.02", nama_indikator: "HTTPS aktif dan valid", aspek_id: "aspek-1", bobot: 25, deskripsi: "Sertifikat SSL terpasang dan valid", aktif: true },
  { id: "ind-03", kode: "KL.03", nama_indikator: "Response time < 3 detik", aspek_id: "aspek-1", bobot: 20, deskripsi: "Halaman utama termuat dalam waktu kurang dari 3 detik", aktif: true },
  { id: "ind-04", kode: "KL.04", nama_indikator: "Tidak ada error halaman (404/500)", aspek_id: "aspek-1", bobot: 15, deskripsi: "Tidak ditemukan broken link atau error server pada navigasi utama", aktif: true },
  { id: "ind-05", kode: "KL.05", nama_indikator: "Tampilan responsif (mobile-friendly)", aspek_id: "aspek-1", bobot: 10, deskripsi: "Website tampil baik di perangkat mobile", aktif: true },

  // Konten & Informasi Publik (aspek-2)
  { id: "ind-06", kode: "KI.01", nama_indikator: "Profil desa lengkap (visi misi, sejarah, geografi)", aspek_id: "aspek-2", bobot: 15, deskripsi: "Halaman profil desa terisi lengkap", aktif: true },
  { id: "ind-07", kode: "KI.02", nama_indikator: "Struktur organisasi pemerintah desa", aspek_id: "aspek-2", bobot: 10, deskripsi: "SOTK desa ditampilkan dengan foto dan jabatan", aktif: true },
  { id: "ind-08", kode: "KI.03", nama_indikator: "Berita/artikel terbaru (update 30 hari terakhir)", aspek_id: "aspek-2", bobot: 20, deskripsi: "Minimal 1 berita/artikel diterbitkan dalam 30 hari terakhir", aktif: true },
  { id: "ind-09", kode: "KI.04", nama_indikator: "Informasi layanan publik (persyaratan surat, dll)", aspek_id: "aspek-2", bobot: 15, deskripsi: "Informasi tentang layanan administrasi tersedia", aktif: true },
  { id: "ind-10", kode: "KI.05", nama_indikator: "Transparansi anggaran (APBDes/DD)", aspek_id: "aspek-2", bobot: 15, deskripsi: "Data anggaran desa dipublikasikan", aktif: true },
  { id: "ind-11", kode: "KI.06", nama_indikator: "Galeri foto kegiatan desa", aspek_id: "aspek-2", bobot: 10, deskripsi: "Galeri foto berisi dokumentasi kegiatan", aktif: true },
  { id: "ind-12", kode: "KI.07", nama_indikator: "Informasi kontak & peta lokasi kantor desa", aspek_id: "aspek-2", bobot: 15, deskripsi: "Alamat, telepon, email, dan peta kantor desa tersedia", aktif: true },

  // Tata Kelola (aspek-4)
  { id: "ind-13", kode: "TK.01", nama_indikator: "Keaktifan operator (login rutin)", aspek_id: "aspek-4", bobot: 25, deskripsi: "Operator desa login dan melakukan update minimal seminggu sekali", aktif: true },
  { id: "ind-14", kode: "TK.02", nama_indikator: "Jumlah admin/operator memadai (min 2 orang)", aspek_id: "aspek-4", bobot: 20, deskripsi: "Minimal 2 orang ditunjuk sebagai admin/operator website", aktif: true },
  { id: "ind-15", kode: "TK.03", nama_indikator: "SOP pengelolaan website desa tersedia", aspek_id: "aspek-4", bobot: 20, deskripsi: "Desa memiliki SOP atau SK pengelolaan website", aktif: true },
  { id: "ind-16", kode: "TK.04", nama_indikator: "Tindak lanjut kendala/masukan tepat waktu", aspek_id: "aspek-4", bobot: 20, deskripsi: "Kendala yang dilaporkan ditindaklanjuti dalam waktu 14 hari", aktif: true },
  { id: "ind-17", kode: "TK.05", nama_indikator: "Backup data rutin", aspek_id: "aspek-4", bobot: 15, deskripsi: "Data website dibackup secara rutin (minimal bulanan)", aktif: true },
];

// ========== INDIKATOR OPENSID ==========
export const indikatorOpenSIDData: MasterIndikatorOpenSID[] = [
  { id: "oid-01", kode: "OS.01", nama_indikator: "Pembaruan data penduduk rutin", bobot_tambahan: 15, deskripsi: "Data kependudukan di-update minimal sebulan sekali", aktif: true },
  { id: "oid-02", kode: "OS.02", nama_indikator: "Layanan surat online aktif", bobot_tambahan: 20, deskripsi: "Fitur pembuatan surat menyurat digunakan secara aktif", aktif: true },
  { id: "oid-03", kode: "OS.03", nama_indikator: "Statistik kependudukan dipublikasikan", bobot_tambahan: 15, deskripsi: "Widget statistik (grafik/tabel) tampil di website", aktif: true },
  { id: "oid-04", kode: "OS.04", nama_indikator: "Modul SDGs Desa diaktifkan", bobot_tambahan: 10, deskripsi: "Data SDGs Desa terisi dan dipublikasikan", aktif: true },
  { id: "oid-05", kode: "OS.05", nama_indikator: "Layanan mandiri warga aktif", bobot_tambahan: 15, deskripsi: "Warga dapat mengakses layanan mandiri (pengaduan, surat)", aktif: true },
  { id: "oid-06", kode: "OS.06", nama_indikator: "Modul inventaris/aset desa terisi", bobot_tambahan: 10, deskripsi: "Data inventaris dan aset desa ter-update", aktif: true },
  { id: "oid-07", kode: "OS.07", nama_indikator: "Peta wilayah desa tersedia", bobot_tambahan: 10, deskripsi: "Peta OpenStreetMap wilayah desa terkonfigurasi", aktif: true },
  { id: "oid-08", kode: "OS.08", nama_indikator: "Versi OpenSID terbaru (update rutin)", bobot_tambahan: 5, deskripsi: "OpenSID ter-update ke versi terbaru", aktif: true },
];

// ========== PERIODE EVALUASI ==========
export const periodeData: PeriodeEvaluasi[] = [
  { id: "per-01", nama_periode: "Triwulan I 2026", tanggal_mulai: "2026-01-01", tanggal_selesai: "2026-03-31", status: "selesai" },
  { id: "per-02", nama_periode: "Triwulan II 2026", tanggal_mulai: "2026-04-01", tanggal_selesai: "2026-06-30", status: "selesai" },
  { id: "per-03", nama_periode: "Triwulan III 2026", tanggal_mulai: "2026-07-01", tanggal_selesai: "2026-09-30", status: "berjalan" },
];

// ========== HASIL EVALUASI (mock generated) ==========
function generateHasilEvaluasi(): HasilEvaluasi[] {
  const results: HasilEvaluasi[] = [];
  const periodes = ["per-01", "per-02"];

  let idx = 0;
  for (const periodeId of periodes) {
    for (const desa of desaData) {
      idx++;
      // Generate realistic-looking deterministic scores using indices instead of Math.random()
      const baseSkor = 50 + (idx % 40); // 50-90 range
      const variance = (idx % 20) - 10;
      const adjustedSkor = Math.max(10, Math.min(98, baseSkor + variance));
      const totalSkor = Math.round(adjustedSkor * 10) / 10;

      const skorPerAspek: Record<string, number> = {};
      let aspectIdx = 0;
      for (const aspek of aspekData) {
        aspectIdx++;
        const aspekSkor = Math.max(
          0,
          Math.min(100, totalSkor + ((idx + aspectIdx) % 30) - 15)
        );
        skorPerAspek[aspek.id] = Math.round(aspekSkor * 10) / 10;
      }

      results.push({
        id: `he-${desa.id}-${periodeId}`,
        desa_id: desa.id,
        periode_id: periodeId,
        total_skor: totalSkor,
        klasifikasi: getKlasifikasi(totalSkor),
        skor_per_aspek: skorPerAspek,
        dihitung_pada:
          periodeId === "per-01"
            ? "2026-04-05T10:00:00Z"
            : "2026-07-05T10:00:00Z",
      });
    }
  }

  return results;
}

export const hasilEvaluasiData: HasilEvaluasi[] = generateHasilEvaluasi();

// ========== LOG MONITORING ==========
function generateLogMonitoring(): LogMonitoring[] {
  const logs: LogMonitoring[] = [];
  const sampleDesa = desaData.slice(0, 50);

  let idx = 0;
  for (const desa of sampleDesa) {
    idx++;
    const httpOk = (idx % 8) !== 0; // Deterministic 200/error
    logs.push({
      id: `log-${desa.id}`,
      desa_id: desa.id,
      tanggal_cek: "2026-07-12T08:00:00Z",
      http_status: httpOk ? 200 : (idx % 2 === 0 ? 404 : 503),
      https_aktif: httpOk && (idx % 3 !== 0),
      response_time_ms: httpOk
        ? 200 + (idx * 37) % 2000
        : 0,
      keterangan: httpOk ? "OK" : "Website tidak dapat diakses",
    });
  }

  return logs;
}

export const logMonitoringData: LogMonitoring[] = generateLogMonitoring();

// ========== KENDALA ==========
export const kendalaData: Kendala[] = [
  { id: "k-01", desa_id: "desa-005", periode_id: "per-02", deskripsi: "Website sering down karena hosting murah, perlu migrasi ke hosting yang lebih stabil", status: "diproses", tindak_lanjut: "Sedang koordinasi dengan Diskominfo untuk migrasi ke server desa.id", dilaporkan_pada: "2026-05-15T10:00:00Z", diupdate_pada: "2026-06-01T14:00:00Z" },
  { id: "k-02", desa_id: "desa-012", periode_id: "per-02", deskripsi: "Operator desa resign, belum ada pengganti yang terlatih", status: "baru", tindak_lanjut: "", dilaporkan_pada: "2026-06-20T09:00:00Z", diupdate_pada: "2026-06-20T09:00:00Z" },
  { id: "k-03", desa_id: "desa-023", periode_id: "per-02", deskripsi: "Koneksi internet di kantor desa sangat lambat, kesulitan upload foto dan dokumen", status: "diproses", tindak_lanjut: "Sudah diajukan permintaan pemasangan jaringan fiber optic ke Kominfo", dilaporkan_pada: "2026-04-10T08:00:00Z", diupdate_pada: "2026-05-20T11:00:00Z" },
  { id: "k-04", desa_id: "desa-034", periode_id: "per-01", deskripsi: "Tidak paham cara menggunakan modul layanan surat online", status: "selesai", tindak_lanjut: "Sudah dilaksanakan pelatihan oleh admin kecamatan pada 15 Maret 2026", dilaporkan_pada: "2026-02-28T10:00:00Z", diupdate_pada: "2026-03-16T09:00:00Z" },
  { id: "k-05", desa_id: "desa-045", periode_id: "per-02", deskripsi: "SSL certificate expired, website menampilkan warning 'Not Secure'", status: "selesai", tindak_lanjut: "SSL sudah diperbarui melalui Let's Encrypt", dilaporkan_pada: "2026-05-01T07:00:00Z", diupdate_pada: "2026-05-03T10:00:00Z" },
  { id: "k-06", desa_id: "desa-056", periode_id: "per-03", deskripsi: "Perangkat komputer kantor desa rusak, hanya bisa akses via HP", status: "baru", tindak_lanjut: "", dilaporkan_pada: "2026-07-10T08:00:00Z", diupdate_pada: "2026-07-10T08:00:00Z" },
  { id: "k-07", desa_id: "desa-067", periode_id: "per-02", deskripsi: "Tidak bisa login ke admin panel OpenSID, lupa password", status: "selesai", tindak_lanjut: "Password sudah direset oleh super admin", dilaporkan_pada: "2026-06-05T09:00:00Z", diupdate_pada: "2026-06-05T14:00:00Z" },
  { id: "k-08", desa_id: "desa-078", periode_id: "per-03", deskripsi: "Data penduduk belum dimigrasikan dari sistem lama (Excel) ke OpenSID", status: "diproses", tindak_lanjut: "Tim IT Diskominfo sedang membantu proses import data", dilaporkan_pada: "2026-07-01T10:00:00Z", diupdate_pada: "2026-07-08T16:00:00Z" },
];

// ========== MASTER WEBSITE (sample) ==========
export const masterWebsiteData: MasterWebsite[] = desaData.slice(0, 30).map((desa, i) => ({
  id: `mw-${desa.id}`,
  desa_id: desa.id,
  operator: `Operator ${desa.nama_desa}`,
  no_wa: `08${1200000000 + i * 1111}`,
  email: `operator@${desa.nama_desa.toLowerCase().replace(/\s+/g, "")}.desa.id`,
  tahun_mulai_gunakan: 2020 + (i % 5),
  jumlah_operator: 1 + (i % 3),
  perangkat_digunakan: ["Laptop", "PC Desktop", "HP Android"][i % 3],
  kecepatan_internet: ["< 5 Mbps", "5-10 Mbps", "10-20 Mbps", "> 20 Mbps"][i % 4],
  pengelola_website: ["Sekretaris Desa", "Kaur Umum", "Staf IT Desa", "Operator Desa"][i % 4],
  frekuensi_update: ["Harian", "Mingguan", "Bulanan", "Jarang"][i % 4],
  kendala: "",
  saran: "",
  updated_at: "2026-06-15T10:00:00Z",
}));

// ========== USERS ==========
export const usersData: UserApp[] = [
  { id: "u-01", nama: "Admin Diskominfo", email: "admin@bandungkab.go.id", role: "super_admin", desa_id: null, kecamatan_id: null },
  { id: "u-02", nama: "Admin DPMD", email: "dpmd@bandungkab.go.id", role: "super_admin", desa_id: null, kecamatan_id: null },
  { id: "u-03", nama: "Camat Soreang", email: "kec.soreang@bandungkab.go.id", role: "admin_kecamatan", desa_id: null, kecamatan_id: "kec-30" },
  { id: "u-04", nama: "Camat Banjaran", email: "kec.banjaran@bandungkab.go.id", role: "admin_kecamatan", desa_id: null, kecamatan_id: "kec-03" },
  { id: "u-05", nama: "Operator Desa Arjasari", email: "operator@arjasari.desa.id", role: "operator_desa", desa_id: "desa-001", kecamatan_id: "kec-01" },
  { id: "u-06", nama: "Bupati Bandung", email: "bupati@bandungkab.go.id", role: "viewer", desa_id: null, kecamatan_id: null },
];

// ========== DASHBOARD STATS CALCULATOR ==========
export function getDashboardStats(periodeId: string = "per-02"): DashboardStats {
  const hasilPeriode = hasilEvaluasiData.filter((h) => h.periode_id === periodeId);
  const websiteAktif = desaData.filter((d) => d.status_aktif).length;

  // Distribution
  const distribusi: Record<Klasifikasi, number> = {
    "Sangat Aktif": 0,
    "Aktif": 0,
    "Cukup Aktif": 0,
    "Kurang Aktif": 0,
    "Tidak Aktif": 0,
  };
  for (const h of hasilPeriode) {
    distribusi[h.klasifikasi]++;
  }

  // Average score
  const totalSkor = hasilPeriode.reduce((sum, h) => sum + h.total_skor, 0);
  const rataRata = hasilPeriode.length > 0 ? totalSkor / hasilPeriode.length : 0;

  // Kecamatan ranking
  const kecScores: Record<string, { total: number; count: number }> = {};
  for (const h of hasilPeriode) {
    const desa = desaData.find((d) => d.id === h.desa_id);
    if (!desa) continue;
    if (!kecScores[desa.kecamatan_id]) {
      kecScores[desa.kecamatan_id] = { total: 0, count: 0 };
    }
    kecScores[desa.kecamatan_id].total += h.total_skor;
    kecScores[desa.kecamatan_id].count++;
  }

  const kecRanking = Object.entries(kecScores)
    .map(([kecId, data]) => ({
      nama: kecamatanData.find((k) => k.id === kecId)?.nama_kecamatan ?? kecId,
      skor: Math.round((data.total / data.count) * 10) / 10,
    }))
    .sort((a, b) => b.skor - a.skor);

  // Trend across periods
  const trendData = periodeData
    .filter((p) => p.status !== "draft")
    .map((p) => {
      const hp = hasilEvaluasiData.filter((h) => h.periode_id === p.id);
      const avg = hp.length > 0 ? hp.reduce((s, h) => s + h.total_skor, 0) / hp.length : 0;
      return { periode: p.nama_periode, skor: Math.round(avg * 10) / 10 };
    });

  return {
    totalDesa: desaData.length,
    websiteAktif,
    websiteTidakAktif: desaData.length - websiteAktif,
    rataRataSkor: Math.round(rataRata * 10) / 10,
    desaDinilai: hasilPeriode.length,
    desaBelumDinilai: desaData.length - hasilPeriode.length,
    distribusiKlasifikasi: distribusi,
    topKecamatan: kecRanking.slice(0, 5),
    bottomKecamatan: kecRanking.slice(-5).reverse(),
    trendData,
  };
}

// ========== HELPER: Get desa with kecamatan name ==========
export function getDesaWithKecamatan() {
  return desaData.map((d) => ({
    ...d,
    nama_kecamatan:
      kecamatanData.find((k) => k.id === d.kecamatan_id)?.nama_kecamatan ?? "",
  }));
}

// ========== HELPER: Get hasil evaluasi with desa info ==========
export function getHasilEvaluasiDisplay(periodeId: string) {
  return hasilEvaluasiData
    .filter((h) => h.periode_id === periodeId)
    .map((h) => {
      const desa = desaData.find((d) => d.id === h.desa_id);
      const kec = kecamatanData.find((k) => k.id === desa?.kecamatan_id);
      return {
        ...h,
        nama_desa: desa?.nama_desa ?? "",
        nama_kecamatan: kec?.nama_kecamatan ?? "",
        url_website: desa?.url_website ?? "",
      };
    })
    .sort((a, b) => b.total_skor - a.total_skor);
}
