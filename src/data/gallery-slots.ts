// Reparto de los 13 espacios de imagen de «Sobre mí» (3 de mosaico + 10 de trayectoria).
// Lo usan el sitio (al construirse) y el panel («Imágenes»), así ambos muestran siempre lo mismo.
// Archivo IDÉNTICO en Mauricio y Fernanda. Sin dependencias: función pura.

export interface GalleryItem { slot: string; image_url: string; alt: string; caption: string; alt_en?: string; caption_en?: string }

/** manual = cargada a mano · evento = foto de un evento · evento-sin-foto = epígrafe de un evento sin foto · vacio = nada que mostrar */
export type SlotSource = 'manual' | 'evento' | 'evento-sin-foto' | 'vacio';
export interface ResolvedSlot extends GalleryItem { source: SlotSource; origin?: string }

export interface AboutSource { image_url: string; alt: string; caption: string }

export const GALLERY_SLOTS: string[] = [
  'mosaico-1', 'mosaico-2', 'mosaico-3',
  ...Array.from({ length: 10 }, (_, i) => `trayectoria-${i + 1}`),
];

/**
 * Prioridad por espacio:
 *   1) imagen cargada a mano en `gallery_items`;
 *   2) fotos de los eventos marcados «Aparece en Sobre mí»;
 *   3) valor por defecto (epígrafe sin foto: no se muestra en el sitio).
 */
export function resolveSlots(defaults: GalleryItem[], rows: GalleryItem[], auto: AboutSource[]): Map<string, ResolvedSlot> {
  const map = new Map<string, ResolvedSlot>(defaults.map((g) => [g.slot, { ...g, source: g.image_url ? 'manual' : 'vacio' } as ResolvedSlot]));
  for (const r of rows) {
    const base = map.get(r.slot);
    const image_url = r.image_url ?? '';
    map.set(r.slot, {
      slot: r.slot, image_url, alt: r.alt ?? '', caption: r.caption ?? base?.caption ?? '',
      alt_en: r.alt_en ?? '', caption_en: r.caption_en ?? base?.caption_en ?? '',
      source: image_url ? 'manual' : 'vacio',
    });
  }
  const withPhoto = auto.filter((a) => a.image_url);
  const withoutPhoto = auto.filter((a) => !a.image_url);
  const empty = GALLERY_SLOTS.filter((s) => !map.get(s)?.image_url);
  empty.slice(0, withPhoto.length).forEach((slot, i) => {
    const a = withPhoto[i];
    map.set(slot, { slot, image_url: a.image_url, alt: a.alt, caption: a.caption, alt_en: a.alt, caption_en: a.caption, source: 'evento', origin: a.alt });
  });
  empty.slice(withPhoto.length).filter((s) => s.startsWith('trayectoria-')).slice(0, withoutPhoto.length).forEach((slot, i) => {
    const a = withoutPhoto[i];
    map.set(slot, { slot, image_url: '', alt: a.alt, caption: a.caption, alt_en: a.alt, caption_en: a.caption, source: 'evento-sin-foto', origin: a.alt });
  });
  return map;
}
