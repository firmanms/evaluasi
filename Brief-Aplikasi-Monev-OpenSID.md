# Brief Aplikasi
## Monitoring & Evaluasi Pemanfaatan Sistem Informasi Desa (OpenSID) dan Website Desa
### Kabupaten Bandung

---

## 1. Latar Belakang

Seluruh 270 desa dan 10 kelurahan di Kabupaten Bandung telah menggunakan OpenSID. Namun sejauh ini belum ada instrumen terstandar untuk mengukur **tingkat pemanfaatan** dan **kualitas pengelolaan** website desa, bukan sekadar status "sudah terpasang / belum". Aplikasi ini dibangun untuk menjawab kebutuhan tersebut: mendigitalkan proses monitoring, evaluasi, penskoran, dan pelaporan secara terpusat, periodik, dan dapat dipertanggungjawabkan.

## 2. Tujuan

1. Menyediakan instrumen penilaian terstruktur (indikator + bobot) untuk website desa dan pemanfaatan OpenSID.
2. Menstandarkan proses input data monitoring dari 280 desa/kelurahan.
3. Menghitung skor dan klasifikasi keaktifan secara otomatis dan konsisten.
4. Menyajikan dashboard rekap untuk pengambilan keputusan tingkat kabupaten dan kecamatan.
5. Mendokumentasikan kendala dan tindak lanjut sebagai bahan pembinaan desa.

## 3. Ruang Lingkup

- Cakupan wilayah: 270 desa + 10 kelurahan, dikelompokkan per kecamatan.
- Periode evaluasi: berkala (disarankan **triwulanan**, dapat dikonfigurasi jadi bulanan/semesteran).
- Objek yang dinilai: website desa berbasis OpenSID (ketersediaan, konten, pemanfaatan fitur, tata kelola).

## 4. Pengguna & Peran (Role)

| Peran | Akses |
|---|---|
| **Super Admin (Diskominfo/DPMD Kabupaten)** | Kelola master data, master indikator, kelola pengguna, lihat semua dashboard & laporan |
| **Admin Kecamatan** | Input/verifikasi penilaian desa di wilayahnya, lihat dashboard kecamatan |
| **Operator Desa** | Update profil website & data master website desa masing-masing, mengisi kendala/saran, (opsional) self-assessment awal |
| **Pimpinan/Viewer (Bupati, Kepala Dinas, dsb.)** | Akses dashboard & laporan (read-only) |

Autentikasi & otorisasi memanfaatkan **Supabase Auth** dengan **Row Level Security (RLS)** per role dan per wilayah (desa/kecamatan) agar operator hanya bisa mengubah data desanya sendiri.

## 5. Arsitektur Teknis

- **Frontend & Backend logic:** Next.js (App Router), React Server Components untuk halaman dashboard/laporan, Server Actions untuk form input/penilaian.
- **Database & Auth & Storage:** Supabase (PostgreSQL, Auth, Storage untuk lampiran bukti/screenshot, Edge Functions untuk job terjadwal).
- **UI:** Tailwind CSS + shadcn/ui, komponen chart dengan Recharts.
- **Cron/Job otomatis:** Supabase Edge Function / cron (mis. `pg_cron`) untuk cek status aksesibilitas website (HTTP status, HTTPS, response time) secara berkala.
- **Hosting:** Vercel (frontend) + Supabase Cloud (backend).
- **Ekspor laporan:** generate PDF/Excel (server-side, mis. `exceljs`/`pdf-lib`) untuk rekap per desa, per kecamatan, per periode.

## 6. Struktur Data (Skema Awal Supabase)

**`kecamatan`**
`id, nama_kecamatan`

**`desa`**
`id, nama_desa, jenis (desa/kelurahan), kecamatan_id, url_website, status_aktif, created_at`

**`master_website`** (1–1 dengan `desa`, diisi/di-update operator)
`id, desa_id, operator, no_wa, email, tahun_mulai_gunakan, jumlah_operator, perangkat_digunakan, kecepatan_internet, pengelola_website, frekuensi_update, kendala, saran, updated_at`

**`master_indikator`** (indikator umum website)
`id, kode, nama_indikator, aspek, bobot, deskripsi, aktif`

**`master_indikator_opensid`** (indikator tambahan khusus fitur OpenSID)
`id, kode, nama_indikator, bobot_tambahan, deskripsi, aktif`

**`master_aspek`**
`id, nama_aspek (Ketersediaan Layanan/Konten & Informasi Publik/Pemanfaatan OpenSID/Tata Kelola), bobot_persen`

**`periode_evaluasi`**
`id, nama_periode (mis. "Triwulan III 2026"), tanggal_mulai, tanggal_selesai, status (draft/berjalan/selesai)`

**`penilaian`** (transaksi input skor per desa per periode per indikator)
`id, desa_id, periode_id, indikator_id, sumber_indikator (umum/opensid), skor, catatan, bukti_file_url, dinilai_oleh, dinilai_pada`

**`hasil_evaluasi`** (agregat, dihitung dari `penilaian`)
`id, desa_id, periode_id, total_skor, klasifikasi, skor_per_aspek (json), dihitung_pada`

**`log_monitoring_otomatis`** (hasil pengecekan cron)
`id, desa_id, tanggal_cek, http_status, https_aktif, response_time_ms, keterangan`

**`users_app`** (mapping ke Supabase Auth)
`id (auth uid), nama, role, desa_id (nullable), kecamatan_id (nullable)`

## 7. Modul / Fitur Aplikasi

1. **Manajemen Master Data**
   - Kecamatan, Desa/Kelurahan, Master Indikator (umum & OpenSID), Bobot Aspek, Periode Evaluasi.
2. **Profil & Data Website Desa**
   - Formulir yang diisi/diupdate operator desa: operator, kontak (WA/email), tahun mulai, jumlah operator, perangkat, kecepatan internet, pengelola, frekuensi update, kendala, saran.
3. **Input Penilaian / Evaluasi**
   - Form penilaian per desa per periode berdasarkan `master_indikator` + `master_indikator_opensid`, dengan bobot otomatis terisi, kolom catatan dan upload bukti (screenshot).
4. **Pengecekan Otomatis (Monitoring Teknis)**
   - Job terjadwal mengecek aksesibilitas URL, status HTTPS, response time; hasil masuk ke `log_monitoring_otomatis` dan menjadi salah satu input skor "Ketersediaan Layanan".
5. **Mesin Skoring & Klasifikasi**
   - Kalkulasi otomatis: skor per aspek × bobot aspek → total skor 0–100.
   - Klasifikasi otomatis sesuai rentang:
     | Klasifikasi | Rentang Skor |
     |---|---|
     | Sangat Aktif | 85–100 |
     | Aktif | 70–84 |
     | Cukup Aktif | 55–69 |
     | Kurang Aktif | 40–54 |
     | Tidak Aktif | < 40 |
6. **Dashboard Rekap**
   - Jumlah website aktif vs tidak aktif
   - Update minggu ini / bulan ini
   - Desa tanpa berita
   - Desa dengan berita terbanyak
   - Kecamatan paling aktif & paling rendah
   - Persentase website aktif kabupaten
   - Tren skor antar periode (line chart), peta sebaran klasifikasi per kecamatan
7. **Laporan & Ekspor**
   - Rekap per desa, per kecamatan, per periode dalam format PDF/Excel; siap cetak untuk bahan pembinaan/rapat.
8. **Kendala & Tindak Lanjut**
   - Pencatatan kendala yang dilaporkan desa, status tindak lanjut (baru/diproses/selesai), notifikasi ke admin kecamatan/kabupaten.
9. **Manajemen Pengguna & Hak Akses**
   - Super admin mengelola akun admin kecamatan dan operator desa, reset akses, audit log perubahan data.

## 8. Bobot Penilaian (Default, dapat dikonfigurasi di Master Aspek)

| Aspek | Contoh Indikator | Bobot |
|---|---|---|
| Ketersediaan Layanan | Website dapat diakses, HTTPS aktif, tidak ada error | 20% |
| Konten & Informasi Publik | Berita terbaru, profil desa, layanan, dokumen publik | 35% |
| Pemanfaatan OpenSID | Pembaruan data, layanan surat, statistik, SDGs, backup | 30% |
| Tata Kelola | Keaktifan operator, SOP pengelolaan, jumlah admin, tindak lanjut kendala | 15% |

Bobot disimpan di tabel `master_aspek` dan `master_indikator` agar dapat disesuaikan tanpa mengubah kode aplikasi (mis. lewat panel admin).

## 9. Alur Kerja (Workflow)

1. Super admin membuka `periode_evaluasi` baru.
2. Operator desa melengkapi/memperbarui `master_website` (profil & kendala/saran).
3. Sistem menjalankan pengecekan otomatis aksesibilitas website → `log_monitoring_otomatis`.
4. Admin kecamatan (atau tim kabupaten) melakukan penilaian per indikator berdasarkan observasi + data otomatis → tersimpan di `penilaian`.
5. Sistem menghitung `hasil_evaluasi` (skor & klasifikasi) otomatis setiap kali penilaian disimpan/di-submit.
6. Dashboard & laporan ter-update real-time untuk seluruh level (kabupaten/kecamatan/desa).
7. Kendala yang dilaporkan ditindaklanjuti dan statusnya diperbarui.

## 10. Kebutuhan Non-Fungsional

- **Skalabilitas:** mendukung ±280 entitas desa/kelurahan, ribuan baris penilaian per periode tanpa penurunan performa.
- **Keamanan:** RLS Supabase per role & wilayah; audit trail perubahan data penting (skor, master indikator).
- **Aksesibilitas & Responsif:** operator desa banyak mengakses via HP — UI wajib mobile-friendly.
- **Ketersediaan data historis:** setiap periode tersimpan permanen untuk analisis tren jangka panjang.
- **Kemudahan konfigurasi:** bobot & indikator dapat diubah oleh super admin tanpa deploy ulang aplikasi.

## 11. Rencana Tahapan Pengembangan (High-Level)

| Tahap | Cakupan | Estimasi |
|---|---|---|
| 1. Setup & Master Data | Skema Supabase, auth/role, CRUD kecamatan/desa/indikator | 1–2 minggu |
| 2. Modul Profil Website | Form `master_website`, upload bukti | 1 minggu |
| 3. Modul Penilaian & Skoring | Form penilaian, mesin hitung skor/klasifikasi | 2 minggu |
| 4. Monitoring Otomatis | Cron cek aksesibilitas website | 1 minggu |
| 5. Dashboard & Laporan | Chart rekap, ekspor PDF/Excel | 2 minggu |
| 6. UAT & Pelatihan Operator | Uji coba bersama sampel kecamatan, revisi | 1–2 minggu |
| 7. Go-live bertahap | Rollout ke seluruh 280 desa/kelurahan | 1 minggu |

---

*Dokumen ini adalah brief awal dan dapat disesuaikan lebih lanjut (mis. detail wireframe, API contract, atau ERD visual) sesuai kebutuhan tim pengembang.*
