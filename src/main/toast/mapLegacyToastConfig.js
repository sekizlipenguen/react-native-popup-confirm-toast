const {
  DEFAULT_DURATION,
  TOAST_ANIMATIONS,
  TOAST_MODES,
  TOAST_POSITIONS,
} = require('./constants');
const {nextToastId} = require('./ToastQueue');

let warnedLegacyToast = false;

/**
 * Eski Toast.show config → ActionToast.show config
 */
function mapLegacyToastConfig(config = {}) {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && !warnedLegacyToast) {
    warnedLegacyToast = true;
    // eslint-disable-next-line no-console
    console.warn(
      '[popup-confirm-toast] Toast.show is redirected to ActionToast. Prefer ActionToast.show.',
    );
  }

  const position =
    config.position === 'top' ? TOAST_POSITIONS.top : TOAST_POSITIONS.bottom;

  return {
    id: config.id != null ? String(config.id) : nextToastId(),
    title: config.title || undefined,
    message: config.text || config.message || '',
    backgroundColor: config.backgroundColor || '#1da1f2',
    icon: config.icon || undefined,
    duration: config.timing ?? config.duration ?? DEFAULT_DURATION,
    position,
    animation: TOAST_ANIMATIONS.spring,
    // stack: ekranda başka toast varken de hemen görün (queue pending’e gömülmesin)
    mode: TOAST_MODES.stack,
    maxVisible: 3,
    textColor: '#FFFFFF',
    closeable: true,
    type: config.type || undefined,
    onOpen: typeof config.onOpen === 'function' ? config.onOpen : undefined,
    onOpenComplete:
      typeof config.onOpenComplete === 'function' ? config.onOpenComplete : undefined,
    onClose: typeof config.onClose === 'function' ? config.onClose : undefined,
    onCloseComplete:
      typeof config.onCloseComplete === 'function' ? config.onCloseComplete : undefined,
    styles: {
      title: config.titleTextStyle || undefined,
      message: config.descTextStyle || undefined,
    },
  };
}

module.exports = {
  mapLegacyToastConfig,
};
