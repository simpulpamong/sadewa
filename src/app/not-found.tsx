import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="landing">
      <div className="landing-hero">
        <span className="landing-mark">404</span>
        <p className="landing-kicker">Halaman tidak ditemukan</p>
        <h1>Alamat tidak dikenali</h1>
        <p className="landing-intro">
          Kategori/subkategori laporan tidak tersedia. Pastikan data sudah di-seed ke Firestore, lalu pilih dari menu utama.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/?menu=1" className="btn">Kembali ke Menu</Link>
        </p>
      </div>
    </main>
  );
}
