# SEHATI — Sistem Informasi Sekretariat HETI

Aplikasi manajemen kepegawaian dan sekretariat berbasis web untuk PMU HETI, mencakup absensi berbasis geolokasi, log kerja bulanan, manajemen izin, agenda, dan laporan.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 + Shadcn UI |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Maps | Leaflet + React Leaflet |
| Forms | React Hook Form + Zod |
| Export | @react-pdf/renderer + XLSX |
| Date | date-fns |

---

## Fitur Utama

### Absensi
- Check-in/check-out berbasis geolokasi dengan verifikasi radius kantor
- Deteksi otomatis WFH jika lokasi di luar radius
- Tracking keterlambatan dengan hitungan menit
- Koreksi absensi dengan workflow approval
- Integrasi otomatis dengan data izin yang sudah disetujui

### Log Kerja Bulanan
- Input kegiatan harian dengan output dan tag kategori
- Submisi log per bulan
- Multi-level review: PIC → Kepala Sekretariat → Kasubdit
- Status: Draft → Submitted → Reviewed → Approved / Revision

### Manajemen Izin
- Jenis: Izin, Cuti, Sakit, Surat Tugas
- Workflow: Pengajuan → Approval → Integrasi absensi otomatis
- Upload dokumen (Google Drive link)

### Agenda
- Kalender event/meeting tim
- Manajemen peserta dan lokasi
- Hak akses berbasis creator/admin

### Laporan
- Rekap absensi dan log kerja
- Export PDF dan Excel
- Filter per karyawan, bulan, dan tahun
- Akses sesuai role (karyawan lihat sendiri, PIC lihat tim, admin lihat semua)

### Administrasi (Admin)
- Manajemen user dan bidang/departemen
- Konfigurasi kantor: koordinat, radius geofencing, jam masuk/pulang
- Manajemen hari libur nasional dan cuti bersama

---

## Role & Hak Akses

| Role | Keterangan |
|------|-----------|
| `admin` | Akses penuh, manage user & konfigurasi |
| `kasubdit` | Approve akhir log, lihat semua laporan |
| `kepala_sekretariat` | Verifikasi log karyawan |
| `pic` | Review log dan izin tim |
| `karyawan` | Absensi, log, lihat laporan sendiri |

---

## Struktur Database

### Tabel Utama

| Tabel | Keterangan |
|-------|-----------|
| `users` | Data pengguna, terhubung ke Supabase Auth |
| `pegawai_profil` | Data kepegawaian tambahan (1-to-1 dengan users) |
| `bidang` | Struktur divisi/departemen (mendukung hierarki) |
| `absensi` | Record check-in/check-out harian |
| `absensi_koreksi` | Pengajuan koreksi data absensi |
| `izin_karyawan` | Pengajuan izin/cuti/surat tugas |
| `log_bulanan` | Header log kerja per bulan per karyawan |
| `log_entry` | Detail kegiatan harian dalam log bulanan |
| `log_approval` | Jejak approval log bulanan |
| `agenda` | Event/meeting tim |
| `agenda_peserta` | Daftar peserta per agenda |
| `kantor_config` | Konfigurasi lokasi dan jam kantor |
| `hari_libur` | Hari libur nasional dan cuti bersama |
| `notifikasi` | Notifikasi in-app per user |
| `dokumen` | Dokumen kepegawaian (SK, kontrak, sertifikat) |
| `evaluasi` | Evaluasi kinerja per periode |

Semua tabel menggunakan **Row Level Security (RLS)** Supabase.

---

## Struktur Project

```
src/
├── app/
│   ├── (dashboard)/         # Protected routes (dashboard)
│   │   ├── absensi/         # Halaman absensi
│   │   ├── agenda/          # Kalender agenda
│   │   ├── laporan/         # Laporan & rekap
│   │   ├── log/             # Log kerja bulanan
│   │   ├── profil/          # Profil pengguna
│   │   ├── review/          # Review log (reviewer)
│   │   └── admin/           # Halaman admin
│   ├── (auth)/              # Reset & update password
│   ├── api/
│   │   ├── laporan/users/   # GET users dalam periode
│   │   └── time/            # GET server time
│   ├── actions/             # Server Actions (Supabase mutations)
│   └── login/
├── components/
│   ├── absensi/             # Komponen absensi & peta
│   ├── agenda/              # Kalender & form agenda
│   ├── log/                 # Log entry & review
│   ├── laporan/             # Laporan shell
│   ├── pdf/                 # Komponen export PDF
│   ├── onboarding/          # Welcome & complete profile modal
│   ├── layout/              # Sidebar, header, menu
│   └── ui/                  # Shadcn UI components
├── lib/
│   └── supabase/
│       ├── client.ts        # Browser client
│       ├── server.ts        # Server client
│       └── admin.ts         # Admin client (service role)
└── middleware.ts             # Auth guard
```

---

## Setup Development

### 1. Clone & Install

```bash
git clone https://github.com/ridhowiro/sehati.git
cd sehati
npm install
```

### 2. Environment Variables

Buat file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Supabase Projects

| Environment | Project |
|-------------|---------|
| Development | `SEHATI-DEVELOPMENT` |
| Production | `SEHATI` |

Pastikan `.env.local` mengarah ke project yang sesuai.

---

## Branch Strategy

| Branch | Keterangan |
|--------|-----------|
| `main` | Production — deploy ke server live |
| `development` | Development — fitur & bugfix aktif |

Workflow: buat fitur di `development` → PR ke `main` → deploy.
