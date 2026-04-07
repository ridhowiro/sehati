import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { KaryawanRekap } from '@/app/actions/laporan'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const statusLabel: Record<string, string> = {
  hadir: 'Hadir',
  wfh: 'WFH',
  terlambat: 'Terlambat',
  tidak_hadir: 'Tidak Hadir',
  izin: 'Izin',
  sakit: 'Sakit',
  cuti: 'Cuti',
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, paddingTop: 28, paddingBottom: 40, paddingHorizontal: 36 },
  title: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 3 },
  subtitle: { fontSize: 9, textAlign: 'center', color: '#555', marginBottom: 14 },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { width: 90, fontFamily: 'Helvetica-Bold' },
  infoValue: { flex: 1 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 6, borderBottom: '1px solid #ccc', paddingBottom: 3 },
  // table shared
  th: { backgroundColor: '#f0f0f0', flexDirection: 'row', borderTop: '1px solid #999', borderLeft: '1px solid #999' },
  tr: { flexDirection: 'row', borderLeft: '1px solid #999' },
  td: { padding: '3 4', borderRight: '1px solid #999', borderBottom: '1px solid #999' },
  thText: { fontFamily: 'Helvetica-Bold', fontSize: 8, textAlign: 'center' },
  tdText: { fontSize: 8 },
  // absensi cols
  colNo: { width: 22 },
  colTgl: { width: 64 },
  colStatus: { width: 60 },
  colCi: { width: 48 },
  colCo: { width: 48 },
  colTerlambat: { width: 56 },
  // log cols
  colNoL: { width: 22 },
  colTglL: { width: 64 },
  colKegiatan: { flex: 2 },
  colOutput: { flex: 1 },
  colKategori: { width: 60 },
  // summary
  summaryRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  summaryBox: { flex: 1, border: '1px solid #ddd', padding: '6 8', borderRadius: 3 },
  summaryLabel: { fontSize: 8, color: '#666' },
  summaryValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 2 },
})

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
}

function fmtTgl(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

interface RekapPDFProps {
  rekapList: KaryawanRekap[]
  bulan: number
  tahun: number
}

function UserPage({ rekap, bulan, tahun }: { rekap: KaryawanRekap; bulan: number; tahun: number }) {
  const hadir = rekap.absensi.filter(a => a.status === 'hadir' || a.status === 'terlambat').length
  const wfh = rekap.absensi.filter(a => a.status === 'wfh').length
  const tidakHadir = rekap.absensi.filter(a => a.status === 'tidak_hadir').length
  const terlambat = rekap.absensi.filter(a => a.is_late).length

  return (
    <Page size="A4" style={s.page} orientation="landscape">
      {/* Header */}
      <Text style={s.title}>REKAP BULANAN — SEKRETARIAT PMU HETI</Text>
      <Text style={s.subtitle}>Periode {bulanNames[bulan]} {tahun}</Text>

      <View style={s.infoRow}><Text style={s.infoLabel}>Nama</Text><Text style={s.infoValue}>: {rekap.full_name}</Text></View>
      <View style={s.infoRow}><Text style={s.infoLabel}>Jabatan</Text><Text style={s.infoValue}>: {rekap.jabatan_formal || '-'}</Text></View>
      <View style={s.infoRow}><Text style={s.infoLabel}>Bidang</Text><Text style={s.infoValue}>: {rekap.bidang_nama || '-'}</Text></View>

      {/* Summary boxes */}
      <View style={s.summaryRow}>
        <View style={s.summaryBox}><Text style={s.summaryLabel}>Hadir / WFO</Text><Text style={s.summaryValue}>{hadir} hari</Text></View>
        <View style={s.summaryBox}><Text style={s.summaryLabel}>WFH</Text><Text style={s.summaryValue}>{wfh} hari</Text></View>
        <View style={s.summaryBox}><Text style={s.summaryLabel}>Tidak Hadir</Text><Text style={s.summaryValue}>{tidakHadir} hari</Text></View>
        <View style={s.summaryBox}><Text style={s.summaryLabel}>Terlambat</Text><Text style={s.summaryValue}>{terlambat} kali</Text></View>
        <View style={s.summaryBox}><Text style={s.summaryLabel}>Entri Log</Text><Text style={s.summaryValue}>{rekap.log_entries.length} kegiatan</Text></View>
      </View>

      {/* Absensi table */}
      <Text style={s.sectionTitle}>Rekap Absensi</Text>
      {rekap.absensi.length > 0 ? (
        <View>
          <View style={s.th}>
            <View style={[s.td, s.colNo]}><Text style={s.thText}>No</Text></View>
            <View style={[s.td, s.colTgl]}><Text style={s.thText}>Tanggal</Text></View>
            <View style={[s.td, s.colStatus]}><Text style={s.thText}>Status</Text></View>
            <View style={[s.td, s.colCi]}><Text style={s.thText}>Check-in</Text></View>
            <View style={[s.td, s.colCo]}><Text style={s.thText}>Check-out</Text></View>
            <View style={[s.td, s.colTerlambat]}><Text style={s.thText}>Terlambat</Text></View>
          </View>
          {rekap.absensi.map((a, i) => (
            <View style={s.tr} key={a.tanggal}>
              <View style={[s.td, s.colNo]}><Text style={[s.tdText, { textAlign: 'center' }]}>{i + 1}</Text></View>
              <View style={[s.td, s.colTgl]}><Text style={s.tdText}>{fmtTgl(a.tanggal)}</Text></View>
              <View style={[s.td, s.colStatus]}><Text style={s.tdText}>{statusLabel[a.status] || a.status}</Text></View>
              <View style={[s.td, s.colCi]}><Text style={s.tdText}>{fmt(a.checkin_time)}</Text></View>
              <View style={[s.td, s.colCo]}><Text style={s.tdText}>{fmt(a.checkout_time)}</Text></View>
              <View style={[s.td, s.colTerlambat]}>
                <Text style={s.tdText}>{a.is_late ? `${a.menit_terlambat ?? 0} menit` : '-'}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ fontSize: 8, color: '#888', marginTop: 4 }}>Tidak ada data absensi</Text>
      )}

      {/* Log aktivitas */}
      <Text style={s.sectionTitle}>Log Aktivitas{rekap.log_status ? ` (${rekap.log_status})` : ''}</Text>
      {rekap.log_entries.length > 0 ? (
        <View>
          <View style={s.th}>
            <View style={[s.td, s.colNoL]}><Text style={s.thText}>No</Text></View>
            <View style={[s.td, s.colTglL]}><Text style={s.thText}>Tanggal</Text></View>
            <View style={[s.td, s.colKegiatan]}><Text style={s.thText}>Kegiatan</Text></View>
            <View style={[s.td, s.colOutput]}><Text style={s.thText}>Output</Text></View>
            <View style={[s.td, s.colKategori]}><Text style={s.thText}>Kategori</Text></View>
          </View>
          {rekap.log_entries.map((e, i) => (
            <View style={s.tr} key={`${e.tanggal}-${i}`}>
              <View style={[s.td, s.colNoL]}><Text style={[s.tdText, { textAlign: 'center' }]}>{i + 1}</Text></View>
              <View style={[s.td, s.colTglL]}><Text style={s.tdText}>{fmtTgl(e.tanggal)}</Text></View>
              <View style={[s.td, s.colKegiatan]}><Text style={s.tdText}>{e.kegiatan}</Text></View>
              <View style={[s.td, s.colOutput]}><Text style={s.tdText}>{e.output || '-'}</Text></View>
              <View style={[s.td, s.colKategori]}><Text style={s.tdText}>{e.tag_kategori || '-'}</Text></View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ fontSize: 8, color: '#888', marginTop: 4 }}>Tidak ada entri log aktivitas</Text>
      )}
    </Page>
  )
}

export function RekapPDF({ rekapList, bulan, tahun }: RekapPDFProps) {
  return (
    <Document>
      {rekapList.map(rekap => (
        <UserPage key={rekap.user_id} rekap={rekap} bulan={bulan} tahun={tahun} />
      ))}
    </Document>
  )
}
