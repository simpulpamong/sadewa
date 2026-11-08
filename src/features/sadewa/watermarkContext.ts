'use client';

import { useApp } from '../core/AppContext';
import { composeManualAddress, autoWatermarkLogo, type WatermarkContext } from '../core/watermark';
import type { BuildContext } from '../core/usePhotoProcessor';

function parseCoord(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Konteks watermark sadewa dengan format yang sama seperti kategori lain. */
export function useSadewaWatermarkContext(): BuildContext {
  const { category, location, coords } = useApp();
  const wmLogo = autoWatermarkLogo(category);
  const isDamkar = wmLogo === 'damkar';
  const brand = category.watermarkBrand || (isDamkar ? 'DAMKAR PONOROGO' : 'SATPOL PP PONOROGO');

  return input => {
    const lat = input.exif?.gps?.lat ?? parseCoord(coords.lat);
    const lng = input.exif?.gps?.lng ?? parseCoord(coords.lng);
    const gps = lat !== null && lng !== null ? { lat, lng } : null;

    const context: WatermarkContext = {
      program: category.parentCategory?.name || (category.slug === 'odnk' ? 'ODNK' : category.name),
      unit: '',
      fallbackAddress: composeManualAddress(location),
      gps,
      address: input.address,
      capturedAt: input.capturedAt,
      brand,
      watermarkLogo: wmLogo,
    };
    return context;
  };
}
