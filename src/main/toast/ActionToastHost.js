/**
 * Global host — Metro yerel bağlantı/watchFolders çift çözümünde bile tek instance.
 */
const GLOBAL_KEY = '__SP_ACTION_TOAST_HOST__';

function getGlobal() {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  return {};
}

export function registerActionToastHost(instance) {
  const g = getGlobal();
  g[GLOBAL_KEY] = instance;
}

export function unregisterActionToastHost(instance) {
  const g = getGlobal();
  if (g[GLOBAL_KEY] === instance) {
    g[GLOBAL_KEY] = null;
  }
}

export function getActionToastHost() {
  const g = getGlobal();
  return g[GLOBAL_KEY] || null;
}
