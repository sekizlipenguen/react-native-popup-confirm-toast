/**
 * Shared mask / dim color helpers for Popup + SPSheet.
 * Mask is always STATIC (no opacity animation) — Fabric Modal safe.
 */

export const DEFAULT_DIM = 'rgba(0, 0, 0, 0.5)';
export const DEFAULT_MASK_OPACITY = 0.5;

/**
 * Parse #RGB / #RRGGBB / rgb() / rgba() into { r, g, b, a }.
 */
export function parseColor(input) {
  if (input == null || input === '' || input === 'transparent') {
    return null;
  }

  const value = String(input).trim();

  if (value[0] === '#') {
    let hex = value.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6) {
      return null;
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }

  const rgba = value.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i,
  );
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] != null ? Number(rgba[4]) : 1,
    };
  }

  return null;
}

export function toRgba({r, g, b, a}) {
  const alpha = Math.max(0, Math.min(1, a == null ? 1 : a));
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
}

/**
 * Resolve final mask color from config.
 *
 * Priority:
 * 1. `maskColor` (or `mask.color`)
 * 2. `background`
 * 3. DEFAULT_DIM
 *
 * Then apply `maskOpacity` / `mask.opacity` / `opacity` if provided (0–1).
 */
export function resolveMaskColor(config = {}) {
  const nested = config.mask && typeof config.mask === 'object' ? config.mask : {};
  const base =
    nested.color ||
    config.maskColor ||
    config.background ||
    DEFAULT_DIM;

  if (base === 'transparent') {
    return 'transparent';
  }

  const opacityRaw =
    nested.opacity ??
    config.maskOpacity ??
    config.opacity;

  if (opacityRaw == null || opacityRaw === false) {
    return base;
  }

  const opacity = Number(opacityRaw);
  if (!Number.isFinite(opacity)) {
    return base;
  }

  const parsed = parseColor(base);
  if (!parsed) {
    // Named colors etc. — fall back to black with requested opacity
    return `rgba(0, 0, 0, ${Math.max(0, Math.min(1, opacity))})`;
  }

  return toRgba({...parsed, a: opacity});
}
