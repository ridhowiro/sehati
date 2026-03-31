import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* Animasi angka 404 */}
        <div className="relative mb-8">
          <p className="text-[120px] font-bold text-zinc-800 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl animate-bounce">🔍</div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-white mb-3">
          Halaman Tidak Ditemukan
        </h1>

        <p className="text-zinc-400 text-sm mb-2">
          Kayaknya halaman ini lagi cuti dan lupa ngajuin izin...
        </p>
        <p className="text-zinc-600 text-xs mb-8">
          atau mungkin belum dibangun. Sabar ya! 😅
        </p>

        {/* Fake log entry */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8 text-left">
          <p className="text-xs text-zinc-500 mb-2 font-medium">Log Aktivitas Terakhir:</p>
          <div className="space-y-1.5">
            <div className="flex gap-2 text-xs">
              <span className="text-zinc-600 w-16 shrink-0">10:24</span>
              <span className="text-zinc-400">Mencari halaman...</span>
              <span className="text-green-500 ml-auto">✓</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-zinc-600 w-16 shrink-0">10:24</span>
              <span className="text-zinc-400">Ketuk pintu server...</span>
              <span className="text-green-500 ml-auto">✓</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-zinc-600 w-16 shrink-0">10:24</span>
              <span className="text-zinc-400">Tidak ada yang menjawab</span>
              <span className="text-red-500 ml-auto">✗</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-zinc-600 w-16 shrink-0">10:24</span>
              <span className="text-zinc-400">Halaman sedang izin sakit</span>
              <span className="text-yellow-500 ml-auto">!</span>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Kembali ke Dashboard
        </Link>

        <p className="text-zinc-700 text-xs mt-6">
          SEHATI · Sekretariat PMU HETI
        </p>
      </div>
    </div>
  )
}