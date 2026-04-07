'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 45,
    color: '#1a1a1a',
  },
  // Cover
  coverPage: {
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 45,
  },
  coverBadge: {
    backgroundColor: '#2563eb',
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 24,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    textAlign: 'center',
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 40,
  },
  coverDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#2563eb',
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.8,
  },
  // Header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 8,
    marginBottom: 20,
  },
  pageHeaderTitle: {
    fontSize: 9,
    color: '#6b7280',
    fontFamily: 'Helvetica',
  },
  pageHeaderBrand: {
    fontSize: 9,
    color: '#2563eb',
    fontFamily: 'Helvetica-Bold',
  },
  // Section
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    marginBottom: 12,
    marginTop: 20,
    borderLeft: '3px solid #2563eb',
    paddingLeft: 8,
  },
  subSectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    marginBottom: 6,
    marginTop: 14,
  },
  // Text
  paragraph: {
    fontSize: 10,
    lineHeight: 1.7,
    color: '#374151',
    marginBottom: 8,
  },
  // Step
  stepContainer: {
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 20,
    height: 20,
    backgroundColor: '#2563eb',
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    borderRadius: 10,
    textAlign: 'center',
    paddingTop: 4,
    marginRight: 8,
    flexShrink: 0,
  },
  stepText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
    flex: 1,
    paddingTop: 3,
  },
  // Bullet
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bulletDot: {
    fontSize: 10,
    color: '#2563eb',
    marginRight: 6,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
    flex: 1,
  },
  // Info box
  infoBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 4,
    padding: 10,
    marginVertical: 8,
  },
  infoBoxTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 9,
    color: '#1e40af',
    lineHeight: 1.6,
  },
  // Warning box
  warnBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 4,
    padding: 10,
    marginVertical: 8,
  },
  warnBoxText: {
    fontSize: 9,
    color: '#92400e',
    lineHeight: 1.6,
  },
  // Role table
  table: {
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    borderRadius: 3,
    marginBottom: 2,
  },
  tableHeaderCell: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    padding: 7,
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
    padding: 7,
    lineHeight: 1.5,
  },
  col1: { width: '25%' },
  col2: { width: '75%' },
  col3: { width: '33%' },
  // Badge
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 45,
    right: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  // Divider
  divider: {
    borderBottom: '1px solid #e5e7eb',
    marginVertical: 12,
  },
})

const Header = ({ title }: { title: string }) => (
  <View style={styles.pageHeader} fixed>
    <Text style={styles.pageHeaderBrand}>SEHATI</Text>
    <Text style={styles.pageHeaderTitle}>{title}</Text>
  </View>
)

const Footer = () => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>Sistem Informasi Sekretariat HETI</Text>
    <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
      `Halaman ${pageNumber} dari ${totalPages}`
    } />
  </View>
)

const Step = ({ n, text }: { n: number; text: string }) => (
  <View style={styles.stepRow}>
    <Text style={styles.stepNumber}>{n}</Text>
    <Text style={styles.stepText}>{text}</Text>
  </View>
)

const Bullet = ({ text }: { text: string }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{text}</Text>
  </View>
)

export function PanduanPDF() {
  return (
    <Document title="Panduan Penggunaan SEHATI" author="PMU HETI">

      {/* COVER */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverBadge}>PMU HETI</Text>
        <Text style={styles.coverTitle}>SEHATI</Text>
        <Text style={styles.coverSubtitle}>Sistem Informasi Sekretariat HETI{'\n'}Panduan Penggunaan Aplikasi</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverMeta}>
          Versi 1.0  |  April 2026{'\n'}
          Dokumen ini berisi panduan lengkap penggunaan{'\n'}
          aplikasi SEHATI untuk seluruh pegawai PMU HETI
        </Text>
        <Footer />
      </Page>

      {/* DAFTAR ISI */}
      <Page size="A4" style={styles.page}>
        <Header title="Daftar Isi" />
        <Text style={styles.sectionTitle}>Daftar Isi</Text>

        {[
          ['1', 'Pengenalan SEHATI', '3'],
          ['2', 'Login & Pengaturan Akun', '4'],
          ['3', 'Absensi (Check-in & Check-out)', '5'],
          ['4', 'Log Kerja Bulanan', '6'],
          ['5', 'Pengajuan Izin', '7'],
          ['6', 'Agenda', '8'],
          ['7', 'Laporan & Export', '9'],
          ['8', 'Panduan per Role', '10'],
          ['9', 'Administrasi (Admin)', '11'],
        ].map(([no, judul, hal]) => (
          <View key={no} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottom: '1px solid #f3f4f6' }}>
            <Text style={{ fontSize: 10, color: '#374151' }}>{no}.  {judul}</Text>
            <Text style={{ fontSize: 10, color: '#6b7280' }}>{hal}</Text>
          </View>
        ))}
        <Footer />
      </Page>

      {/* BAB 1 - PENGENALAN */}
      <Page size="A4" style={styles.page}>
        <Header title="Pengenalan SEHATI" />
        <Text style={styles.sectionTitle}>1. Pengenalan SEHATI</Text>
        <Text style={styles.paragraph}>
          SEHATI (Sistem Informasi Sekretariat HETI) adalah aplikasi manajemen kepegawaian berbasis web yang dirancang khusus untuk PMU HETI. Aplikasi ini membantu pengelolaan absensi, log kerja, izin, agenda, dan laporan secara digital dan terintegrasi.
        </Text>

        <Text style={styles.subSectionTitle}>Fitur Utama</Text>
        <Bullet text="Absensi digital berbasis geolokasi dengan verifikasi lokasi kantor" />
        <Bullet text="Log kerja bulanan dengan sistem multi-level approval" />
        <Bullet text="Pengajuan dan persetujuan izin/cuti secara online" />
        <Bullet text="Kalender agenda bersama untuk seluruh tim" />
        <Bullet text="Laporan dan rekap yang dapat diekspor ke PDF & Excel" />

        <Text style={styles.subSectionTitle}>Role Pengguna</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>Role</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Hak Akses</Text>
          </View>
          {[
            ['Karyawan', 'Absensi, log kerja sendiri, pengajuan izin, lihat agenda'],
            ['PIC', 'Semua akses karyawan + review log & izin tim'],
            ['Kepala Sekretariat', 'Verifikasi log, kelola izin, lihat laporan semua karyawan'],
            ['Kasubdit', 'Persetujuan akhir log, lihat semua laporan'],
            ['Admin', 'Akses penuh: manajemen user, konfigurasi sistem'],
          ].map(([role, akses]) => (
            <View key={role} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1, { fontFamily: 'Helvetica-Bold', color: '#1e3a5f' }]}>{role}</Text>
              <Text style={[styles.tableCell, styles.col2]}>{akses}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>Akses Aplikasi</Text>
          <Text style={styles.infoBoxText}>
            Aplikasi dapat diakses melalui browser di: sehati-one.vercel.app{'\n'}
            Gunakan email dan password yang telah diberikan oleh Admin.
          </Text>
        </View>
        <Footer />
      </Page>

      {/* BAB 2 - LOGIN */}
      <Page size="A4" style={styles.page}>
        <Header title="Login & Pengaturan Akun" />
        <Text style={styles.sectionTitle}>2. Login & Pengaturan Akun</Text>

        <Text style={styles.subSectionTitle}>Login</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka aplikasi SEHATI di browser." />
          <Step n={2} text="Masukkan email dan password yang telah diberikan Admin." />
          <Step n={3} text="Klik tombol Masuk." />
          <Step n={4} text="Jika pertama kali login, lengkapi data profil (tanggal lahir, no. HP, alamat) yang muncul secara otomatis." />
        </View>

        <Text style={styles.subSectionTitle}>Reset Password</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Klik tautan Lupa Password di halaman login." />
          <Step n={2} text="Masukkan email yang terdaftar." />
          <Step n={3} text="Cek email masuk dan klik tautan reset password." />
          <Step n={4} text="Masukkan password baru dan konfirmasi." />
        </View>

        <Text style={styles.subSectionTitle}>Mengubah Data Profil</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Klik nama/avatar di pojok kanan atas, pilih Profil." />
          <Step n={2} text="Perbarui data yang diinginkan (nama, no. HP, alamat, tanggal lahir)." />
          <Step n={3} text="Klik Simpan." />
        </View>

        <View style={styles.warnBox}>
          <Text style={styles.warnBoxText}>
            Catatan: Data profil wajib dilengkapi sebelum dapat menggunakan fitur-fitur lain di aplikasi. Modal pengisian akan muncul otomatis jika profil belum lengkap.
          </Text>
        </View>
        <Footer />
      </Page>

      {/* BAB 3 - ABSENSI */}
      <Page size="A4" style={styles.page}>
        <Header title="Absensi" />
        <Text style={styles.sectionTitle}>3. Absensi (Check-in & Check-out)</Text>
        <Text style={styles.paragraph}>
          Fitur absensi menggunakan verifikasi lokasi (geofencing). Pastikan GPS aktif dan izin lokasi diberikan ke browser sebelum melakukan absensi.
        </Text>

        <Text style={styles.subSectionTitle}>Check-in</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka menu Absensi dari sidebar." />
          <Step n={2} text="Klik tombol Check-in." />
          <Step n={3} text="Izinkan browser mengakses lokasi Anda." />
          <Step n={4} text="Sistem akan memverifikasi apakah Anda berada dalam radius kantor. Jika di luar radius, absensi akan tercatat sebagai WFH." />
          <Step n={5} text="Check-in berhasil — status dan waktu akan tampil di dashboard." />
        </View>

        <Text style={styles.subSectionTitle}>Check-out</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Klik tombol Check-out di halaman Absensi." />
          <Step n={2} text="Konfirmasi lokasi, klik Checkout." />
          <Step n={3} text="Durasi kerja akan dihitung otomatis." />
        </View>

        <Text style={styles.subSectionTitle}>Status Absensi</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>Status</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Keterangan</Text>
          </View>
          {[
            ['Hadir', 'Check-in dalam radius kantor sebelum batas toleransi'],
            ['Terlambat', 'Check-in melewati jam masuk + toleransi yang ditetapkan'],
            ['WFH', 'Check-in di luar radius kantor'],
            ['Tidak Hadir', 'Tidak melakukan check-in sama sekali'],
          ].map(([status, ket]) => (
            <View key={status} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1, { fontFamily: 'Helvetica-Bold' }]}>{status}</Text>
              <Text style={[styles.tableCell, styles.col2]}>{ket}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.subSectionTitle}>Koreksi Absensi</Text>
        <Text style={styles.paragraph}>
          Jika terdapat kesalahan data absensi, karyawan dapat mengajukan koreksi:
        </Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Di halaman Absensi, klik ikon koreksi pada data yang ingin diperbaiki." />
          <Step n={2} text="Pilih jenis koreksi: Koreksi Check-in, Koreksi Check-out, atau Dispensasi." />
          <Step n={3} text="Isi alasan dan waktu yang seharusnya, lalu submit." />
          <Step n={4} text="Atasan akan memproses pengajuan koreksi." />
        </View>
        <Footer />
      </Page>

      {/* BAB 4 - LOG KERJA */}
      <Page size="A4" style={styles.page}>
        <Header title="Log Kerja Bulanan" />
        <Text style={styles.sectionTitle}>4. Log Kerja Bulanan</Text>
        <Text style={styles.paragraph}>
          Log kerja bulanan adalah catatan kegiatan harian yang wajib diisi setiap bulan dan disetujui melalui proses multi-level approval.
        </Text>

        <Text style={styles.subSectionTitle}>Alur Log Kerja</Text>
        <View style={[styles.infoBox, { marginBottom: 12 }]}>
          <Text style={styles.infoBoxText}>
            Draft  →  Submit  →  Review PIC  →  Verifikasi Kasek  →  Approve Kasubdit
          </Text>
        </View>

        <Text style={styles.subSectionTitle}>Membuat Log Bulanan</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka menu Log dari sidebar." />
          <Step n={2} text="Klik Buat Log Baru, pilih bulan dan tahun." />
          <Step n={3} text="Klik + Tambah Kegiatan untuk setiap hari kerja." />
          <Step n={4} text="Isi: Tanggal, Kegiatan, Output, Kategori, dan Status Kegiatan." />
          <Step n={5} text="Simpan setiap entri." />
        </View>

        <Text style={styles.subSectionTitle}>Submit Log untuk Review</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Pastikan semua kegiatan bulan tersebut sudah diisi." />
          <Step n={2} text="Klik tombol Submit Log." />
          <Step n={3} text="Konfirmasi pengiriman — setelah submit, entri tidak dapat diubah kecuali dikembalikan untuk revisi." />
        </View>

        <Text style={styles.subSectionTitle}>Status Kegiatan</Text>
        <Bullet text="Selesai — kegiatan telah diselesaikan" />
        <Bullet text="Proses — kegiatan masih berjalan" />
        <Bullet text="Ditunda — kegiatan belum dapat dilaksanakan" />

        <View style={styles.warnBox}>
          <Text style={styles.warnBoxText}>
            Penting: Log tidak dapat diisi untuk tanggal yang akan datang. Pengisian maksimal sampai hari ini.
          </Text>
        </View>
        <Footer />
      </Page>

      {/* BAB 5 - IZIN */}
      <Page size="A4" style={styles.page}>
        <Header title="Pengajuan Izin" />
        <Text style={styles.sectionTitle}>5. Pengajuan Izin</Text>

        <Text style={styles.subSectionTitle}>Jenis Izin yang Tersedia</Text>
        <Bullet text="Surat Tugas — perjalanan dinas atau tugas luar kantor" />
        <Bullet text="Cuti — cuti tahunan atau cuti khusus" />
        <Bullet text="Sakit — izin karena sakit (dapat disertai surat dokter)" />

        <Text style={styles.subSectionTitle}>Cara Mengajukan Izin</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka menu Absensi → tab Izin." />
          <Step n={2} text="Klik Ajukan Izin." />
          <Step n={3} text="Pilih jenis izin, tanggal mulai dan selesai." />
          <Step n={4} text="Isi keterangan/alasan izin." />
          <Step n={5} text="Lampirkan link Google Drive (opsional, untuk surat dokter/surat tugas)." />
          <Step n={6} text="Klik Ajukan — izin akan masuk ke antrian persetujuan atasan." />
        </View>

        <Text style={styles.subSectionTitle}>Status Izin</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>Status</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Keterangan</Text>
          </View>
          {[
            ['Pending', 'Menunggu persetujuan atasan'],
            ['Disetujui', 'Izin disetujui, absensi otomatis tercatat'],
            ['Ditolak', 'Izin tidak disetujui, dapat mengajukan ulang'],
          ].map(([s, k]) => (
            <View key={s} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1, { fontFamily: 'Helvetica-Bold' }]}>{s}</Text>
              <Text style={[styles.tableCell, styles.col2]}>{k}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>Integrasi dengan Absensi</Text>
          <Text style={styles.infoBoxText}>
            Setelah izin disetujui, data absensi pada tanggal yang bersangkutan akan otomatis diperbarui sehingga tidak tercatat sebagai tidak hadir.
          </Text>
        </View>
        <Footer />
      </Page>

      {/* BAB 6 - AGENDA */}
      <Page size="A4" style={styles.page}>
        <Header title="Agenda" />
        <Text style={styles.sectionTitle}>6. Agenda</Text>
        <Text style={styles.paragraph}>
          Fitur Agenda adalah kalender bersama untuk seluruh tim PMU HETI. Semua pegawai dapat melihat agenda, namun hanya pembuat atau atasan yang dapat mengubah atau menghapus.
        </Text>

        <Text style={styles.subSectionTitle}>Melihat Agenda</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka menu Agenda dari sidebar." />
          <Step n={2} text="Tampilan kalender menampilkan semua agenda bulan ini." />
          <Step n={3} text="Klik event di kalender untuk melihat detail: waktu, lokasi, dan deskripsi." />
          <Step n={4} text="Gunakan tombol navigasi untuk berpindah bulan." />
        </View>

        <Text style={styles.subSectionTitle}>Membuat Agenda Baru</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Klik tombol + Tambah Agenda." />
          <Step n={2} text="Isi Judul agenda (wajib)." />
          <Step n={3} text="Pilih Tanggal, Waktu Mulai, dan Waktu Selesai." />
          <Step n={4} text="Isi Lokasi dan Deskripsi (opsional)." />
          <Step n={5} text="Klik Simpan — agenda langsung tampil di kalender." />
        </View>

        <Text style={styles.subSectionTitle}>Mengedit atau Menghapus Agenda</Text>
        <Bullet text="Hanya pembuat agenda atau atasan (Admin, Kasubdit, Kepala Sekretariat) yang dapat mengedit atau menghapus." />
        <Bullet text="Klik agenda di kalender, lalu pilih Edit atau Hapus." />
        <Footer />
      </Page>

      {/* BAB 7 - LAPORAN */}
      <Page size="A4" style={styles.page}>
        <Header title="Laporan & Export" />
        <Text style={styles.sectionTitle}>7. Laporan & Export</Text>
        <Text style={styles.paragraph}>
          Fitur Laporan menyediakan rekap absensi dan log kerja yang dapat diekspor dalam format PDF maupun Excel.
        </Text>

        <Text style={styles.subSectionTitle}>Melihat Laporan Absensi</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka menu Laporan dari sidebar." />
          <Step n={2} text="Pilih Bulan dan Tahun yang ingin dilihat." />
          <Step n={3} text="Jika Anda PIC/Atasan, pilih nama karyawan dari dropdown." />
          <Step n={4} text="Rekap absensi ditampilkan dalam tabel: total hadir, WFH, terlambat, dan tidak hadir." />
        </View>

        <Text style={styles.subSectionTitle}>Export PDF</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Setelah memilih periode dan karyawan, klik tombol Export PDF." />
          <Step n={2} text="File PDF akan otomatis terunduh." />
        </View>

        <Text style={styles.subSectionTitle}>Export Excel</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Klik tombol Export Excel di halaman Laporan." />
          <Step n={2} text="File .xlsx akan otomatis terunduh." />
        </View>

        <Text style={styles.subSectionTitle}>Akses Laporan per Role</Text>
        <Bullet text="Karyawan: hanya dapat melihat laporan milik sendiri." />
        <Bullet text="PIC: dapat melihat laporan seluruh anggota tim di bidangnya." />
        <Bullet text="Kepala Sekretariat & Kasubdit: dapat melihat laporan semua karyawan." />
        <Bullet text="Admin: akses penuh ke semua laporan." />
        <Footer />
      </Page>

      {/* BAB 8 - PANDUAN PER ROLE */}
      <Page size="A4" style={styles.page}>
        <Header title="Panduan per Role" />
        <Text style={styles.sectionTitle}>8. Panduan per Role</Text>

        <Text style={styles.subSectionTitle}>PIC — Mereview Log Tim</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka menu Review dari sidebar." />
          <Step n={2} text="Daftar log yang menunggu review ditampilkan." />
          <Step n={3} text="Klik nama karyawan untuk melihat detail log." />
          <Step n={4} text="Pilih Setujui atau Kembalikan (dengan komentar revisi)." />
        </View>

        <Text style={styles.subSectionTitle}>PIC — Memproses Izin Tim</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka menu Admin → Izin Karyawan." />
          <Step n={2} text="Klik Setujui atau Tolak pada pengajuan yang masuk." />
          <Step n={3} text="Berikan catatan jika diperlukan." />
        </View>

        <View style={styles.divider} />

        <Text style={styles.subSectionTitle}>Kepala Sekretariat — Verifikasi Log</Text>
        <Bullet text="Log yang sudah di-review PIC akan masuk ke antrian verifikasi Kepala Sekretariat." />
        <Bullet text="Alur sama seperti review PIC: buka Review → lihat detail → verifikasi atau kembalikan." />

        <View style={styles.divider} />

        <Text style={styles.subSectionTitle}>Kasubdit — Persetujuan Akhir Log</Text>
        <Bullet text="Setelah diverifikasi Kepala Sekretariat, log masuk ke Kasubdit untuk persetujuan akhir." />
        <Bullet text="Setelah Kasubdit approve, status log menjadi Approved dan proses selesai." />

        <Footer />
      </Page>

      {/* BAB 9 - ADMIN */}
      <Page size="A4" style={styles.page}>
        <Header title="Administrasi" />
        <Text style={styles.sectionTitle}>9. Administrasi (Admin)</Text>

        <Text style={styles.subSectionTitle}>Manajemen User</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka menu Admin → Users." />
          <Step n={2} text="Klik Tambah User untuk membuat akun baru: isi nama, email, bidang, dan role." />
          <Step n={3} text="User baru akan menerima email verifikasi." />
          <Step n={4} text="Untuk mengubah role atau bidang: klik edit pada baris user." />
          <Step n={5} text="Reset password: klik ikon reset pada baris user yang bersangkutan." />
        </View>

        <Text style={styles.subSectionTitle}>Manajemen Bidang</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka Admin → Bidang." />
          <Step n={2} text="Tambah, edit, atau hapus bidang/departemen." />
          <Step n={3} text="Setiap bidang dapat memiliki PIC yang bertugas mereview tim." />
        </View>

        <Text style={styles.subSectionTitle}>Konfigurasi Kantor</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka Admin → Konfigurasi Kantor." />
          <Step n={2} text="Klik pada peta untuk menentukan koordinat kantor, atau isi latitude/longitude manual." />
          <Step n={3} text="Atur Radius (meter) untuk verifikasi geofencing." />
          <Step n={4} text="Atur Jam Masuk dan Toleransi Keterlambatan (menit)." />
          <Step n={5} text="Atur Jam Pulang Senin-Kamis dan Jam Pulang Jumat." />
          <Step n={6} text="Klik Simpan." />
        </View>

        <Text style={styles.subSectionTitle}>Manajemen Hari Libur</Text>
        <View style={styles.stepContainer}>
          <Step n={1} text="Buka Admin → Hari Libur." />
          <Step n={2} text="Tambahkan tanggal libur nasional atau cuti bersama." />
          <Step n={3} text="Hari libur yang terdaftar tidak akan dihitung sebagai absen." />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>Akses Admin</Text>
          <Text style={styles.infoBoxText}>
            Menu Admin hanya tampil untuk pengguna dengan role Admin. Pastikan hanya memberikan role Admin kepada orang yang berwenang.
          </Text>
        </View>
        <Footer />
      </Page>

    </Document>
  )
}
