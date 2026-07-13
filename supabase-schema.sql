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

-- 3. Tabel Master Website (Profil Pengelolaan - 1 to 1 dengan Desa)
create table master_website (
    id uuid default gen_random_uuid() primary key,
    desa_id uuid references desa(id) on delete cascade not null unique,
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
    role role_user_enum default 'viewer'::role_user_enum not null,
    desa_id uuid references desa(id) on delete set null,
    kecamatan_id uuid references kecamatan(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLICIES (Supabase)
-- ==========================================

-- Enable RLS
alter table kecamatan enable row level security;
alter table desa enable row level security;
alter table master_website enable row level security;
alter table master_aspek enable row level security;
alter table master_indikator enable row level security;
alter table master_indikator_opensid enable row level security;
alter table periode_evaluasi enable row level security;
alter table penilaian enable row level security;
alter table hasil_evaluasi enable row level security;
alter table log_monitoring_otomatis enable row level security;
alter table kendala enable row level security;
alter table users_app enable row level security;

-- 1. Read access for everyone who is authenticated
create policy "Allow read access for authenticated users" on kecamatan for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on desa for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on master_aspek for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on master_indikator for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on master_indikator_opensid for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on periode_evaluasi for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on hasil_evaluasi for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on log_monitoring_otomatis for select using (auth.role() = 'authenticated');

-- 2. Master Data Management: Super Admin only
create policy "Manage kecamatan for super_admin" on kecamatan for all
using (exists (select 1 from users_app where id = auth.uid() and role = 'super_admin'));

create policy "Manage desa for super_admin" on desa for all
using (exists (select 1 from users_app where id = auth.uid() and role = 'super_admin'));

create policy "Manage aspek for super_admin" on master_aspek for all
using (exists (select 1 from users_app where id = auth.uid() and role = 'super_admin'));

create policy "Manage indikator for super_admin" on master_indikator for all
using (exists (select 1 from users_app where id = auth.uid() and role = 'super_admin'));

create policy "Manage indikator_opensid for super_admin" on master_indikator_opensid for all
using (exists (select 1 from users_app where id = auth.uid() and role = 'super_admin'));

create policy "Manage periode_evaluasi for super_admin" on periode_evaluasi for all
using (exists (select 1 from users_app where id = auth.uid() and role = 'super_admin'));

-- 3. Master Website: Operator can write/update their own desa's website profile
create policy "Select master_website for all authenticated" on master_website for select
using (auth.role() = 'authenticated');

create policy "Insert/Update master_website for own desa operator" on master_website for all
using (
    exists (
        select 1 from users_app
        where users_app.id = auth.uid()
        and (users_app.role = 'super_admin' or (users_app.role = 'operator_desa' and users_app.desa_id = master_website.desa_id))
    )
);

-- 4. Penilaian: Super Admin & Admin Kecamatan can do assessments
create policy "Select penilaian for all authenticated" on penilaian for select
using (auth.role() = 'authenticated');

create policy "Manage penilaian for super_admin and admin_kecamatan" on penilaian for all
using (
    exists (
        select 1 from users_app
        where users_app.id = auth.uid()
        and (
            users_app.role = 'super_admin' or
            (users_app.role = 'admin_kecamatan' and exists (
                select 1 from desa where desa.id = penilaian.desa_id and desa.kecamatan_id = users_app.kecamatan_id
            ))
        )
    )
);

-- 5. Kendala: Operators can insert/view their own, Admin Kecamatan can manage their sub-districts, Super Admin all
create policy "Select kendala for all authenticated" on kendala for select
using (auth.role() = 'authenticated');

create policy "Insert kendala for operator" on kendala for insert
with check (
    exists (
        select 1 from users_app
        where users_app.id = auth.uid()
        and users_app.role = 'operator_desa'
        and users_app.desa_id = kendala.desa_id
    )
);

create policy "Manage/Tindak Lanjut kendala for kecamatan & super_admin" on kendala for update
using (
    exists (
        select 1 from users_app
        where users_app.id = auth.uid()
        and (
            users_app.role = 'super_admin' or
            (users_app.role = 'admin_kecamatan' and exists (
                select 1 from desa where desa.id = kendala.desa_id and desa.kecamatan_id = users_app.kecamatan_id
            ))
        )
    )
);
