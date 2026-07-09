/**
 * Shared overlay bus so Popup can render inside an already-open SPSheet Modal.
 * iOS (esp. New Architecture) often fails to present a second sibling Modal.
 *
 * Prefer `isHostActive()` over `hasListener()` — the portal may subscribe a
 * tick after Modal opens; the host flag is set synchronously in SPSheet.show.
 */
let listener = null;
let currentConfig = null;
let hostActive = false;

const OverlayBus = {
  setHostActive(active) {
    hostActive = active === true;
    if (!hostActive) {
      currentConfig = null;
      if (typeof listener === 'function') {
        listener(null);
      }
    }
  },

  isHostActive() {
    return hostActive === true;
  },

  subscribe(fn) {
    listener = fn;
    if (currentConfig && typeof fn === 'function') {
      fn(currentConfig);
    }
    return () => {
      if (listener === fn) {
        listener = null;
      }
    };
  },

  show(config) {
    currentConfig = config;
    if (typeof listener === 'function') {
      listener(currentConfig);
    }
  },

  hide() {
    currentConfig = null;
    if (typeof listener === 'function') {
      listener(null);
    }
  },

  get() {
    return currentConfig;
  },

  hasListener() {
    return typeof listener === 'function';
  },
};

export default OverlayBus;
