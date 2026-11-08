import Link from 'next/link';
import type { CategoryDef } from '@/lib/constants';
import { resolveKategoriImage } from '@/lib/kategoriImage';
import { CategoryLucideIcon } from '@/lib/categoryIcons';

/**
 * Kartu kategori pada menu utama: ilustrasi di kiri, nama + deskripsi di kanan.
 * Mendukung foto bernomor 1–10 (/assets/kategori/{n}.webp), ikon Lucide, maupun path khusus.
 */
export default function CategoryCard({ category }: { category: CategoryDef }) {
  const img = resolveKategoriImage(category.image, '/assets/sadewa.svg');
  return (
    <Link
      className={`landing-card landing-tone-${category.tone}`}
      href={category.href}
      data-flow={category.flow}
    >
      <span className="landing-ico">
        {category.icon ? (
          <CategoryLucideIcon name={category.icon} width={88} height={88} style={{ color: 'var(--accent)' }} />
        ) : (
          <img
            src={img}
            alt=""
            width={256}
            height={256}
            loading="eager"
            decoding="async"
          />
        )}
      </span>
      <span className="landing-copy">
        <strong>{category.name}</strong>
      </span>
    </Link>
  );
}
