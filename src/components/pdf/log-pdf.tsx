import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  header: {
    marginBottom: 16,
    borderBottom: '2px solid #000',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 80,
    fontFamily: 'Helvetica-Bold',
  },
  infoValue: {
    flex: 1,
  },
  table: {
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderTop: '1px solid #000',
    borderLeft: '1px solid #000',
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
  },
  tableRow: {
    flexDirection: 'row',
    borderLeft: '1px solid #000',
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
  },
  colNo: { width: 25, padding: 4, borderRight: '1px solid #000' },
  colTanggal: { width: 70, padding: 4, borderRight: '1px solid #000' },
  colKegiatan: { flex: 2, padding: 4, borderRight: '1px solid #000' },
  colOutput: { flex: 1, padding: 4, borderRight: '1px solid #000' },
  colLink: { flex: 1, padding: 4, borderRight: '1px solid #000' },
  colKet: { width: 70, padding: 4 },
  headerText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'center',
  },
  cellText: {
    fontSize: 9,
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '22%',
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 40,
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 8,
    textAlign: 'center',
    color: '#555',
  },
})

interface LogEntry {
  id: string
  tanggal: string
  kegiatan: string
  output: string | null
  link_dokumen: string | null
  tag_kategori: string | null
  status_kegiatan: string
}

interface Approval {
  role_reviewer: string
  users: { full_name: string } | null
}

interface LogPDFProps {
  log: {
    bulan: number
    tahun: number
  }
  entries: LogEntry[]
  approvals: Approval[]
  userData: {
    full_name: string
    jabatan_formal?: string | null
  }
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    karyawan: 'Staf',
    pic: 'Koordinator',
    kepala_sekretariat: 'Kepala Sekretariat',
    kasubdit: 'Kasubdit',
  }
  return labels[role] || role
}

const getApproval = (approvals: Approval[], role: string) => {
  return approvals.find(a => a.role_reviewer === role)
}

export function LogPDF({ log, entries, approvals, userData }: LogPDFProps) {
  const picApproval = getApproval(approvals, 'pic')
  const kasekApproval = getApproval(approvals, 'kepala_sekretariat')
  const kasubditApproval = getApproval(approvals, 'kasubdit')

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LOG BULANAN SEKRETARIAT PMU HETI</Text>
        </View>

        {/* Info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nama</Text>
          <Text style={styles.infoValue}>: {userData.full_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Posisi</Text>
          <Text style={styles.infoValue}>: {userData.jabatan_formal || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Untuk Bulan</Text>
          <Text style={styles.infoValue}>: {bulanNames[log.bulan]} {log.tahun}</Text>
        </View>

        {/* Tabel */}
        <View style={styles.table}>
          {/* Header tabel */}
          <View style={styles.tableHeader}>
            <View style={styles.colNo}>
              <Text style={styles.headerText}>No</Text>
            </View>
            <View style={styles.colTanggal}>
              <Text style={styles.headerText}>Tanggal</Text>
            </View>
            <View style={styles.colKegiatan}>
              <Text style={styles.headerText}>Kegiatan</Text>
            </View>
            <View style={styles.colOutput}>
              <Text style={styles.headerText}>Output</Text>
            </View>
            <View style={styles.colLink}>
              <Text style={styles.headerText}>Link Dokumen Output</Text>
            </View>
            <View style={styles.colKet}>
              <Text style={styles.headerText}>Keterangan</Text>
            </View>
          </View>

          {/* Rows */}
          {entries.map((entry, index) => (
            <View style={styles.tableRow} key={entry.id}>
              <View style={styles.colNo}>
                <Text style={[styles.cellText, { textAlign: 'center' }]}>{index + 1}</Text>
              </View>
              <View style={styles.colTanggal}>
                <Text style={styles.cellText}>
                  {new Date(entry.tanggal).toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.colKegiatan}>
                <Text style={styles.cellText}>{entry.kegiatan}</Text>
              </View>
              <View style={styles.colOutput}>
                <Text style={styles.cellText}>{entry.output || '-'}</Text>
              </View>
              <View style={styles.colLink}>
                <Text style={styles.cellText}>{entry.link_dokumen || '-'}</Text>
              </View>
              <View style={styles.colKet}>
                <Text style={styles.cellText}>{entry.tag_kategori || '-'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tanda Tangan */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Mengajukan,</Text>
            <Text style={styles.signatureName}>{userData.full_name}</Text>
            <Text style={styles.signatureRole}>{userData.jabatan_formal || 'Staf PMU HETI'}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Mengetahui,</Text>
            <Text style={styles.signatureName}>{picApproval?.users?.full_name || '_______________'}</Text>
            <Text style={styles.signatureRole}>Koordinator PMU HETI</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Memverifikasi,</Text>
            <Text style={styles.signatureName}>{kasekApproval?.users?.full_name || '_______________'}</Text>
            <Text style={styles.signatureRole}>Kepala Sekretariat PMU HETI</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Menyetujui,</Text>
            <Text style={styles.signatureName}>{kasubditApproval?.users?.full_name || '_______________'}</Text>
            <Text style={styles.signatureRole}>Kasubdit Sumber Daya PMU HETI</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}