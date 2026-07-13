-- ==========================================
-- SKEMA DATABASE SUPABASE (POSTGRESQL)
-- APLIKASI MONEV OPENSID & WEBSITE DESA
-- KABUPATEN BANDUNG
-- ==========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tabel Kecamatan
create table kecamatan (
    id uuid default gen_random_uuid() primary key,
    nama_kecamatan varchar(100) not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabel Desa/Kelurahan
create type jenis_desa_enum as enum ('desa', 'kelurahan');

create table desa (
    id uuid default gen_random_uuid() primary key,
    nama_desa varchar(100) not null,
    jenis jenis_desa_enum default 'desa'::jenis_desa_enum not null,
    kecamatan_id uuid references kecamatan(id) on delete cascade not null,
    url_website varchar(255),
    status_aktif boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(nama_desa, kecamatan_id)
);

    -- 2.5. Tabel Master Server
create table master_server (
    id uuid default gen_random_uuid() primary key,
    nama_server varchar(100) not null,
    lokasi_server varchar(50) not null check (lokasi_server in ('Mandiri', 'Kabupaten', 'Provinsi', 'PDN', 'Lainnya')),
    ip_privat varchar(50),
    ip_publik varchar(50),
    ram varchar(50),
    processor varchar(100),
    disk varchar(100),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabel Master Website (Profil Pengelolaan - 1 to 1 dengan Desa)
create table master_website (
    id uuid default gen_random_uuid() primary key,
    desa_id uuid references desa(id) on delete cascade not null unique,
    server_id uuid references master_server(id) on delete set null,
    operator varchar(150),
    no_wa varchar(20),
    email varchar(150),
    tahun_mulai_gunakan integer,
    jumlah_operator integer default 1,
    perangkat_digunakan varchar(100), -- laptop, PC, HP, dll.
    kecepatan_internet varchar(50),
    pengelola_website varchar(100),  -- sekdes, kaur umum, IT, dll.
    frekuensi_update varchar(50),     -- harian, mingguan, bulanan, jarang
    kendala text,
    saran text,
    versi varchar(50),
    jenis_versi varchar(50) default '-', -- Umum, Premium, Lainnya, -
    status_website varchar(50) default 'Aktif', -- Aktif, Tidak Aktif, Error, Maintenance, Diblokir, Lainnya
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabel Master Aspek
create table master_aspek (
    id uuid default gen_random_uuid() primary key,
    nama_aspek varchar(100) not null unique, -- Ketersediaan Layanan, Konten, Pemanfaatan OpenSID, Tata Kelola
    bobot_persen numeric(5, 2) not null check (bobot_persen >= 0 and bobot_persen <= 100),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabel Master Indikator (Umum)
create table master_indikator (
    id uuid default gen_random_uuid() primary key,
    kode varchar(10) not null unique, -- KL.01, KI.01, dll.
    nama_indikator varchar(255) not null,
    aspek_id uuid references master_aspek(id) on delete cascade not null,
    bobot numeric(5, 2) not null check (bobot >= 0),
    deskripsi text,
    aktif boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Tabel Master Indikator OpenSID (Tambahan khusus fitur OpenSID)
create table master_indikator_opensid (
    id uuid default gen_random_uuid() primary key,
    kode varchar(10) not null unique, -- OS.01, OS.02, dll.
    nama_indikator varchar(255) not null,
    bobot_tambahan numeric(5, 2) not null check (bobot_tambahan >= 0),
    deskripsi text,
    aktif boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Tabel Periode Evaluasi
create type status_periode_enum as enum ('draft', 'berjalan', 'selesai');

create table periode_evaluasi (
    id uuid default gen_random_uuid() primary key,
    nama_periode varchar(100) not null unique, -- Contoh: "Triwulan III 2026"
    tanggal_mulai date not null,
    tanggal_selesai date not null,
    status status_periode_enum default 'draft'::status_periode_enum not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    check (tanggal_selesai >= tanggal_mulai)
);

-- 8. Tabel Penilaian (Transaksi skor per indikator per desa per periode)
create type sumber_indikator_enum as enum ('umum', 'opensid');

create table penilaian (
    id uuid default gen_random_uuid() primary key,
    desa_id uuid references desa(id) on delete cascade not null,
    periode_id uuid references periode_evaluasi(id) on delete cascade not null,
    indikator_id uuid not null, -- ID dari master_indikator ATAU master_indikator_opensid (ditentukan dari sumber_indikator)
    sumber_indikator sumber_indikator_enum default 'umum'::sumber_indikator_enum not null,
    skor numeric(5, 2) not null check (skor >= 0 and skor <= 100),
    catatan text,
    bukti_file_url varchar(512), -- Bukti screenshot yang diupload ke Supabase Storage
    dinilai_oleh uuid, -- Link ke auth.users
    dinilai_pada timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(desa_id, periode_id, indikator_id, sumber_indikator)
);

-- 9. Tabel Hasil Evaluasi (Agregat / Cache hasil perhitungan skoring)
create type klasifikasi_enum as enum ('Sangat Aktif', 'Aktif', 'Cukup Aktif', 'Kurang Aktif', 'Tidak Aktif');

create table hasil_evaluasi (
    id uuid default gen_random_uuid() primary key,
    desa_id uuid references desa(id) on delete cascade not null,
    periode_id uuid references periode_evaluasi(id) on delete cascade not null,
    total_skor numeric(5, 2) not null check (total_skor >= 0 and total_skor <= 100),
    klasifikasi klasifikasi_enum not null,
    skor_per_aspek jsonb not null, -- Menyimpan skor per aspek ID dalam format JSON {"aspek_id_1": 85, "aspek_id_2": 90}
    status varchar(20) default 'draft' not null check (status in ('draft', 'selesai')),
    dihitung_pada timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(desa_id, periode_id)
);

-- 10. Tabel Log Monitoring Otomatis (Hasil cron check berkala)
create table log_monitoring_otomatis (
    id uuid default gen_random_uuid() primary key,
    desa_id uuid references desa(id) on delete cascade not null,
    tanggal_cek timestamp with time zone default timezone('utc'::text, now()) not null,
    http_status integer,
    https_aktif boolean default false not null,
    response_time_ms integer default 0,
    keterangan text
);

-- 11. Tabel Kendala & Tindak Lanjut
create type status_kendala_enum as enum ('baru', 'diproses', 'selesai');

create table kendala (
    id uuid default gen_random_uuid() primary key,
    desa_id uuid references desa(id) on delete cascade not null,
    periode_id uuid references periode_evaluasi(id) on delete cascade not null,
    deskripsi text not null,
    status status_kendala_enum default 'baru'::status_kendala_enum not null,
    tindak_lanjut text,
    dilaporkan_pada timestamp with time zone default timezone('utc'::text, now()) not null,
    diupdate_pada timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Tabel Profil Pengguna (Extension/Mapping ke auth.users)
create type role_user_enum as enum ('super_admin', 'admin_kecamatan', 'operator_desa', 'viewer');

create table users_app (
    id uuid primary key references auth.users(id) on delete cascade,
    nama varchar(150) not null,
    email varchar(150) not null unique,
    role role_user_enum default 'viewer'::role_user_enum not null,
    desa_id uuid references desa(id) on delete set null,
    kecamatan_id uuid references kecamatan(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger untuk sinkronisasi otomatis dari auth.users ke users_app saat SignUp
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users_app (id, nama, email, role)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)), 
    new.email, 
    'viewer'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLICIES (Supabase)
-- ==========================================

-- UNTUK DEVELOPMENT LOKAL: RLS dinonaktifkan secara default agar pengujian CRUD
-- tidak terblokir masalah login. Jika Anda ingin mengaktifkan keamanan RLS kembali
-- saat masuk produksi, silakan hilangkan tanda komentar (--) pada perintah di bawah ini.

-- ALTER TABLE kecamatan ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE desa ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE master_website ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE master_aspek ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE master_indikator ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE master_indikator_opensid ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE periode_evaluasi ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE penilaian ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE hasil_evaluasi ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE log_monitoring_otomatis ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kendala ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users_app ENABLE ROW LEVEL SECURITY;

-- Di bawah ini adalah Policy Publik (Bypass Keamanan) untuk mempermudah testing:
CREATE POLICY "Public access for kecamatan" ON kecamatan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for desa" ON desa FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for master_website" ON master_website FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for master_aspek" ON master_aspek FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for master_indikator" ON master_indikator FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for master_indikator_opensid" ON master_indikator_opensid FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for periode" ON periode_evaluasi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for penilaian" ON penilaian FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for hasil_evaluasi" ON hasil_evaluasi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for log_monitoring" ON log_monitoring_otomatis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for kendala" ON kendala FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for users_app" ON users_app FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for master_server" ON master_server FOR ALL USING (true) WITH CHECK (true);
