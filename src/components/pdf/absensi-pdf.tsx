import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const statusLabel: Record<string, string> = {
  hadir: 'Hadir', wfh: 'WFH', terlambat: 'Terlambat', tidak_hadir: 'Tidak Hadir',
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
}
function fmtTgl(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, paddingTop: 30, paddingBottom: 40, paddingHorizontal: 36 },
  title: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 9, textAlign: 'center', color: '#666', marginBottom: 16 },
  info: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { width: 70, fontFamily: 'Helvetica-Bold' },
  summary: { flexDirection: 'row', gap: 6, marginTop: 10, marginBottom: 12 },
  summaryBox: { flex: 1, border: '1px solid #e0e0e0', padding: '5 8', borderRadius: 3 },
  summaryLabel: { fontSize: 7, color: '#888' },
  summaryVal: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  th: { flexDirection: 'row', backgroundColor: '#f4f4f4', borderTop: '1px solid #bbb', borderLeft: '1px solid #bbb' },
  tr: { flexDirection: 'row', borderLeft: '1px solid #bbb' },
  td: { padding: '3 5', borderRight: '1px solid #bbb', borderBottom: '1px solid #bbb', fontSize: 8 },
  tdBold: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  colTgl: { width: 90 }, colStatus: { width: 60 }, colCi: { width: 50 }, colCo: { width: 50 }, colLate: { flex: 1 },
})

interface Rekap {
  user_id: string; full_name: string; bidang_nama: string | null
  absensi: { tanggal: string; status: string; checkin_time: string | null; checkout_time: string | null; is_late: boolean; menit_terlambat: number | null }[]
}

export function AbsensiPDF({ rekapList, periode }: { rekapList: Rekap[]; periode: string }) {
  return (
    <Document>
      {rekapList.map(rekap => {
        const hadir = rekap.absensi.filter(a => a.status === 'hadir' || a.status === 'terlambat').length
        const wfh = rekap.absensi.filter(a => a.status === 'wfh').length
        const tidakHadir = rekap.absensi.filter(a => a.status === 'tidak_hadir').length
        const terlambat = rekap.absensi.filter(a => a.is_late).length
        return (
          <Page key={rekap.user_id} size="A4" style={s.page}>
            <Text style={s.title}>REKAP ABSENSI — SEKRETARIAT PMU HETI</Text>
            <Text style={s.subtitle}>Periode {periode}</Text>
            <View style={s.info}><Text style={s.infoLabel}>Nama</Text><Text>: {rekap.full_name}</Text></View>
            <View style={s.info}><Text style={s.infoLabel}>Bidang</Text><Text>: {rekap.bidang_nama || '-'}</Text></View>
            <View style={s.summary}>
              <View style={s.summaryBox}><Text style={s.summaryLabel}>Hadir / WFO</Text><Text style={s.summaryVal}>{hadir} hari</Text></View>
              <View style={s.summaryBox}><Text style={s.summaryLabel}>WFH</Text><Text style={s.summaryVal}>{wfh} hari</Text></View>
              <View style={s.summaryBox}><Text style={s.summaryLabel}>Tidak Hadir</Text><Text style={s.summaryVal}>{tidakHadir} hari</Text></View>
              <View style={s.summaryBox}><Text style={s.summaryLabel}>Terlambat</Text><Text style={s.summaryVal}>{terlambat} kali</Text></View>
            </View>
            <View style={s.th}>
              <View style={[s.td, s.colTgl]}><Text style={s.tdBold}>Tanggal</Text></View>
              <View style={[s.td, s.colStatus]}><Text style={s.tdBold}>Status</Text></View>
              <View style={[s.td, s.colCi]}><Text style={s.tdBold}>Check-in</Text></View>
              <View style={[s.td, s.colCo]}><Text style={s.tdBold}>Check-out</Text></View>
              <View style={[s.td, s.colLate]}><Text style={s.tdBold}>Terlambat</Text></View>
            </View>
            {rekap.absensi.map(a => (
              <View key={a.tanggal} style={s.tr}>
                <View style={[s.td, s.colTgl]}><Text>{fmtTgl(a.tanggal)}</Text></View>
                <View style={[s.td, s.colStatus]}><Text>{statusLabel[a.status] || a.status}</Text></View>
                <View style={[s.td, s.colCi]}><Text>{fmt(a.checkin_time)}</Text></View>
                <View style={[s.td, s.colCo]}><Text>{fmt(a.checkout_time)}</Text></View>
                <View style={[s.td, s.colLate]}><Text>{a.is_late ? `${a.menit_terlambat ?? 0} menit` : '-'}</Text></View>
              </View>
            ))}
          </Page>
        )
      })}
    </Document>
  )
}
