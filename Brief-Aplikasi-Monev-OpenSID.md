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

- **Frontend & Backend logic:** Next.js 16 (App Router, Turbopack), React Client Components dengan `"use client"` untuk interaktivitas.
- **Database & Auth:** Supabase (PostgreSQL, Auth).
- **UI:** Vanilla CSS dengan design system custom (dark-mode, glassmorphism, micro-animations), komponen chart dengan **Recharts** (PieChart, BarChart, AreaChart).
- **Icon Library:** Lucide React.
- **Import/Export Data:** Library `xlsx` (SheetJS) untuk import dan export Excel di sisi client.
- **Hosting:** Vercel (frontend) + Supabase Cloud (backend).
- **Halaman Login:** Dilengkapi fitur *show/hide password* (ikon mata) dan **captcha perhitungan matematika sederhana**.

## 6. Struktur Data (Skema Database Supabase/PostgreSQL)

**`kecamatan`**
`id (uuid), nama_kecamatan (varchar, unique), created_at`

**`desa`**
`id (uuid), nama_desa (varchar), jenis (enum: desa/kelurahan), kecamatan_id (FK), url_website, status_aktif (boolean), created_at`
- Constraint unique: `(nama_desa, kecamatan_id)` — memastikan nama desa unik per kecamatan.

**`master_server`**
`id (uuid), nama_server, lokasi_server (enum: Mandiri/Kabupaten/Provinsi/PDN/Lainnya), ip_privat, ip_publik, ram, processor, disk, created_at`

**`master_website`** (1–1 dengan `desa`, diisi/di-update operator)
`id (uuid), desa_id (FK, unique), server_id (FK ke master_server), operator, no_wa, email, tahun_mulai_gunakan, jumlah_operator, perangkat_digunakan, kecepatan_internet, pengelola_website, frekuensi_update, kendala, saran, versi, jenis_versi (Umum/Premium/Lainnya/-), status_website (Aktif/Tidak Aktif/Error/Maintenance/Diblokir/Lainnya), pic_nama, pic_no_tel, updated_at`

**`master_aspek`**
`id (uuid), nama_aspek (varchar, unique), bobot_persen (numeric), status_aktif (boolean, default true), created_at`

**`master_indikator`** (indikator umum website)
`id (uuid), kode (varchar, unique), nama_indikator, aspek_id (FK), bobot, deskripsi, aktif, tipe_jawaban (default 'angka'), pilihan_jawaban (jsonb), created_at`

**`master_indikator_opensid`** (indikator tambahan khusus fitur OpenSID)
`id (uuid), kode (varchar, unique), nama_indikator, bobot_tambahan, deskripsi, aktif, tipe_jawaban, pilihan_jawaban (jsonb), created_at`

**`periode_evaluasi`**
`id (uuid), nama_periode, tanggal_mulai, tanggal_selesai, status (enum: draft/berjalan/selesai), created_at`

**`penilaian`** (transaksi input skor per desa per periode per indikator)
`id (uuid), desa_id (FK), periode_id (FK), indikator_id (uuid), sumber_indikator (enum: umum/opensid), skor, catatan, bukti_file_url, dinilai_oleh, dinilai_pada`
- Constraint unique: `(desa_id, periode_id, indikator_id, sumber_indikator)`

**`hasil_evaluasi`** (agregat, dihitung dari `penilaian`)
`id (uuid), desa_id (FK), periode_id (FK), total_skor, klasifikasi (enum), skor_per_aspek (jsonb), status (draft/selesai), dihitung_pada`
- Constraint unique: `(desa_id, periode_id)`

**`log_monitoring_otomatis`** (hasil pengecekan cron)
`id (uuid), desa_id (FK), tanggal_cek, http_status, https_aktif, response_time_ms, keterangan`

**`kendala`**
`id (uuid), desa_id (FK), periode_id (FK), deskripsi, status (enum: baru/diproses/selesai), tindak_lanjut, dilaporkan_pada, diupdate_pada`

**`users_app`** (mapping ke Supabase Auth)
`id (uuid, FK ke auth.users), nama, email (unique), role (enum: super_admin/admin_kecamatan/operator_desa/viewer), desa_id (FK nullable), kecamatan_id (FK nullable), created_at`
- Dilengkapi trigger otomatis `on_auth_user_created` untuk sinkronisasi saat user baru signup.

## 7. Halaman & Modul yang Sudah Diimplementasi

### 7.1. Halaman Login (`/login`)
- Form email & password dengan kredensial default.
- **Show/Hide Password** menggunakan ikon mata (Eye/EyeOff).
- **Captcha perhitungan matematika sederhana** — user diminta menjawab soal penjumlahan acak sebelum bisa login.
- Panel informasi fitur di sisi kiri (dekorasi).

### 7.2. Dashboard (`/dashboard`)
- **Stat Cards** (4 kartu): Total Desa/Kelurahan, Persentase Website Online, Rata-rata Skor, Desa Telah Dinilai.
- **Chart Distribusi Klasifikasi** (Pie Chart): Sangat Aktif, Aktif, Cukup Aktif, Kurang Aktif, Tidak Aktif.
- **Tren Rata-rata Skor per Periode** (Area Chart).
- **Status Akses Website** — progress bar per status (Online, Offline, Error, Maintenance).
- **Distribusi Server** — progress bar per server hosting (data dari `master_website` → `master_server`).
- **Versi OpenSID Terinstall** — progress bar per versi.
- **Jenis Versi** — progress bar per jenis (Umum, Premium, dll.).
- **Ranking Kecamatan** — Top 5 dan Bottom 5 kecamatan berdasarkan rata-rata skor.

### 7.3. Master Data
#### Kecamatan (`/master/kecamatan`)
- CRUD kecamatan, search filter, **import/export Excel** (upsert: insert baru atau update jika sudah ada).

#### Desa / Kelurahan (`/master/desa`)
- CRUD desa dengan relasi ke kecamatan.
- Filter pencarian & filter kecamatan.
- **Import/Export Excel** (upsert: insert baru atau update jika sudah ada).
- Unique constraint `(nama_desa, kecamatan_id)` mencegah duplikat nama desa dalam satu kecamatan.

#### Server (`/master/server`)
- CRUD server hosting dengan field: nama server, lokasi (Mandiri/Kabupaten/Provinsi/PDN/Lainnya), IP privat, IP publik, RAM, processor, disk.
- **Import/Export Excel** (upsert).

#### Indikator Umum (`/master/indikator`)
- CRUD indikator penilaian, terhubung ke aspek.
- Mendukung tipe jawaban: angka, ya/tidak, pilihan ganda, teks.
- Kode indikator berformat: KL.01, KI.01, PO.01, TK.01 dst.

#### Indikator OpenSID (`/master/indikator-opensid`)
- CRUD indikator khusus fitur OpenSID.
- Kode berformat OS.01, OS.02, dst.

#### Aspek & Bobot (`/master/aspek`)
- CRUD aspek penilaian (Ketersediaan Layanan, Konten, Pemanfaatan OpenSID, Tata Kelola).
- Bobot per aspek dalam persen, total harus 100%.
- Fitur **aktif/nonaktif aspek** (`status_aktif`) — aspek yang dinonaktifkan tidak ikut dihitung dalam penilaian.

#### Periode Evaluasi (`/master/periode`)
- CRUD periode evaluasi dengan status: Draft → Berjalan → Selesai.
- Validasi hanya satu periode berstatus "berjalan" pada satu waktu.

### 7.4. Profil Website Desa (`/profil-website`)
- Tampilan **tabel data sebaris** (bukan kartu grid) menampilkan seluruh field:
  - **Desa / Kecamatan**
  - **Server & Infrastruktur**: server hosting, versi OpenSID, perangkat utama, kecepatan internet
  - **Kontak & Pengelola**: operator (nama + WA), email, PIC Diskominfo (nama + no telp), pengelola website, jumlah tim
  - **Status & Kondisi**: status website, frekuensi update, kendala, saran, tahun mulai digunakan
- CRUD profil website (modal form).
- Form mencakup: Desa, Server, Operator, No WA, PIC Diskominfo (Nama & No Telp), Email, Tahun mulai, Jumlah operator, Perangkat, Kecepatan internet, Pengelola, Frekuensi update, Versi, Jenis versi, Status website, Kendala, Saran.
- **Import/Export Excel** (upsert: data yang sudah ada akan di-update, data baru akan di-insert).
- Filter pencarian + filter kecamatan.

### 7.5. Input Penilaian (`/penilaian`)
- Daftar seluruh desa dengan status penilaian (Sudah / Belum Dinilai).
- Halaman detail penilaian per desa (`/penilaian/[desaId]`): form input skor per indikator (umum + OpenSID), catatan, upload bukti.
- **Mesin Skoring Otomatis** (`scoring-engine.ts`): menghitung total skor berbobot → klasifikasi otomatis.
- Klasifikasi disimpan ke tabel `hasil_evaluasi`.

### 7.6. Hasil Evaluasi (`/hasil-evaluasi`)
- Tabel rangkuman hasil penilaian per desa: total skor, klasifikasi, skor per aspek.
- Filter per kecamatan dan pencarian.
- Badge warna per klasifikasi (hijau=Sangat Aktif, biru=Aktif, kuning=Cukup Aktif, oranye=Kurang Aktif, merah=Tidak Aktif).

### 7.7. Monitoring Teknis (`/monitoring`)
- Log monitoring otomatis aksesibilitas website desa.
- Data: HTTP status, HTTPS aktif, response time, keterangan.

### 7.8. Kendala & Tindak Lanjut (`/kendala`)
- Pencatatan kendala yang dilaporkan desa per periode.
- Status: Baru → Diproses → Selesai.
- Field tindak lanjut untuk admin.

### 7.9. Laporan & Ekspor (`/laporan`)
- Daftar desa dengan link ke detail laporan per desa (`/laporan/[desaId]`).
- Laporan detail per desa mencakup skor per aspek, skor per indikator, klasifikasi.

### 7.10. Manajemen Pengguna (`/pengguna`)
- CRUD pengguna aplikasi dengan role: Super Admin, Admin Kecamatan, Operator Desa, Viewer.
- Assign user ke desa atau kecamatan tertentu.

## 8. Komponen UI & Layout

- **Sidebar** navigasi dengan 5 grup menu (Utama, Master Data, Evaluasi, Monitoring, Laporan) — scrollable.
- **Responsive design**: sidebar dengan toggle hamburger menu untuk mobile.
- **Dark theme** dengan variabel CSS custom.
- **Komponen reusable**: Modal, StatCard, InfoItem, search-box, form-input/select/textarea, status-dot, badge, data-table, table-container.
- **Animasi**: fade-in, stagger-children, spin (loader).

## 9. Fitur Import/Export Excel

Semua halaman master data dan profil website mendukung:
- **Export Excel**: mengunduh seluruh data yang tampil menjadi file `.xlsx`.
- **Import Excel**: membaca file `.xlsx`, melakukan **upsert** (insert data baru + update data yang sudah ada berdasarkan identifier unik).
  - Kecamatan: identifier = `nama_kecamatan`
  - Desa: identifier = `(nama_desa, kecamatan_id)`
  - Server: identifier = `nama_server`
  - Profil Website: identifier = `desa_id`

## 10. Bobot Penilaian (Default, dapat dikonfigurasi di Master Aspek)

| Aspek | Contoh Indikator | Bobot |
|---|---|---|
| Ketersediaan Layanan | Website dapat diakses, HTTPS aktif, tidak ada error | 20% |
| Konten & Informasi Publik | Berita terbaru, profil desa, layanan, dokumen publik | 35% |
| Pemanfaatan OpenSID | Pembaruan data, layanan surat, statistik, SDGs, backup | 30% |
| Tata Kelola | Keaktifan operator, SOP pengelolaan, jumlah admin, tindak lanjut kendala | 15% |

Bobot disimpan di tabel `master_aspek` dan `master_indikator`. Aspek yang di-nonaktifkan (`status_aktif = false`) tidak ikut dihitung. Bobot dapat disesuaikan melalui panel admin tanpa mengubah kode.

## 11. Mesin Skoring & Klasifikasi

- Kalkulasi otomatis: skor per aspek × bobot aspek → total skor 0–100.
- Klasifikasi otomatis sesuai rentang:

| Klasifikasi | Rentang Skor |
|---|---|
| Sangat Aktif | 85–100 |
| Aktif | 70–84 |
| Cukup Aktif | 55–69 |
| Kurang Aktif | 40–54 |
| Tidak Aktif | < 40 |

- Implementasi: `src/lib/scoring-engine.ts` — fungsi kalkulasi skor berbobot dan penentuan klasifikasi.

## 12. Alur Kerja (Workflow)

1. Super admin membuka `periode_evaluasi` baru (status: berjalan).
2. Operator desa melengkapi/memperbarui `master_website` (profil, kontak, PIC, kendala/saran).
3. Sistem menjalankan pengecekan otomatis aksesibilitas website → `log_monitoring_otomatis`.
4. Admin kecamatan (atau tim kabupaten) melakukan penilaian per indikator berdasarkan observasi + data otomatis → tersimpan di `penilaian`.
5. Sistem menghitung `hasil_evaluasi` (skor & klasifikasi) otomatis setiap kali penilaian disimpan/di-submit.
6. Dashboard & laporan ter-update real-time untuk seluruh level (kabupaten/kecamatan/desa).
7. Kendala yang dilaporkan ditindaklanjuti dan statusnya diperbarui.

## 13. Kebutuhan Non-Fungsional

- **Skalabilitas:** mendukung ±280 entitas desa/kelurahan, ribuan baris penilaian per periode tanpa penurunan performa.
- **Keamanan:** RLS Supabase per role & wilayah; audit trail perubahan data penting (skor, master indikator). Saat ini RLS dinonaktifkan untuk development.
- **Aksesibilitas & Responsif:** operator desa banyak mengakses via HP — UI wajib mobile-friendly dengan sidebar toggle.
- **Ketersediaan data historis:** setiap periode tersimpan permanen untuk analisis tren jangka panjang.
- **Kemudahan konfigurasi:** bobot, indikator, dan aspek dapat diubah/dinonaktifkan oleh super admin tanpa deploy ulang aplikasi.

## 14. Struktur Folder Proyek

```
src/
├── app/
│   ├── dashboard/page.tsx         # Dashboard utama dengan stat cards & charts
│   ├── login/page.tsx             # Halaman login + captcha
│   ├── master/
│   │   ├── aspek/page.tsx         # CRUD Aspek & Bobot
│   │   ├── desa/page.tsx          # CRUD Desa/Kelurahan
│   │   ├── indikator/page.tsx     # CRUD Indikator Umum
│   │   ├── indikator-opensid/page.tsx  # CRUD Indikator OpenSID
│   │   ├── kecamatan/page.tsx     # CRUD Kecamatan
│   │   ├── periode/page.tsx       # CRUD Periode Evaluasi
│   │   └── server/page.tsx        # CRUD Server Hosting
│   ├── profil-website/page.tsx    # Profil Website Desa (tabel)
│   ├── penilaian/
│   │   ├── page.tsx               # Daftar desa untuk penilaian
│   │   └── [desaId]/page.tsx      # Form input penilaian per desa
│   ├── hasil-evaluasi/page.tsx    # Rangkuman hasil evaluasi
│   ├── monitoring/page.tsx        # Log monitoring teknis
│   ├── kendala/page.tsx           # Kendala & tindak lanjut
│   ├── laporan/
│   │   ├── page.tsx               # Daftar laporan
│   │   └── [desaId]/page.tsx      # Detail laporan per desa
│   ├── pengguna/page.tsx          # Manajemen pengguna
│   ├── globals.css                # Design system & styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page (redirect)
├── components/
│   ├── layout/
│   │   └── sidebar.tsx            # Sidebar navigasi
│   └── ui/
│       └── modal.tsx              # Komponen modal reusable
└── lib/
    ├── supabase.ts                # Supabase client config
    ├── scoring-engine.ts          # Mesin hitung skor & klasifikasi
    └── types.ts                   # TypeScript type definitions
```

## 15. Teknologi & Dependencies

| Teknologi | Versi / Keterangan |
|---|---|
| Next.js | 16.2.10 (Turbopack) |
| React | 19.x |
| TypeScript | 5.x |
| Supabase JS | @supabase/supabase-js |
| Recharts | Chart library (Pie, Bar, Area) |
| Lucide React | Icon library |
| xlsx (SheetJS) | Import/Export Excel |
| Vercel CLI | 50.22.1 (deployment) |
| Supabase | Cloud PostgreSQL |

---

*Dokumen ini adalah brief aplikasi yang diperbarui per **14 Juli 2026** sesuai kondisi implementasi terkini. Seluruh modul utama telah fungsional dan terhubung ke database Supabase.*
