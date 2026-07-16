export const Platform = require('react-native').Platform;
export const Dimensions = require('react-native').Dimensions;

// Android: Modal navigationBarTranslucent / edge-to-edge ile screen yüksekliği
// gerekir. window.height nav bar’ı dışarıda bırakır → altta siyah şerit.
export const HEIGHT =
  Platform.OS === 'android'
    ? Dimensions.get('screen').height
    : Dimensions.get('window').height;

export const WIDTH =
  Platform.OS === 'android' ? Dimensions.get('screen').width : Dimensions.get('window').width;

export const MIN_SHEET_HEIGHT = 100;
export const IOS_KEYBOARD_OVERLAP = 12;
export const DEFAULT_MAX_HEIGHT_RATIO = 0.92;
export const DEFAULT_DIM = 'rgba(0, 0, 0, 0.5)';

/** Default stacking inside the shared Modal host. Higher = on top. */
export const LAYER_Z = {
  sheet: 10,
  popup: 100,
};

/**
 * Sheet motion presets.
 * - slide: translate only
 * - fade: opacity only
 * - fadeSlide: opacity + translate
 * - spring: spring translate
 * - none: instant
 */
export const SHEET_ANIMATIONS = {
  slide: 'slide',
  fade: 'fade',
  fadeSlide: 'fadeSlide',
  spring: 'spring',
  none: 'none',
};

/** Where the sheet enters from (when using slide / fadeSlide / spring). */
export const SHEET_FROM = {
  bottom: 'bottom',
  top: 'top',
  left: 'left',
  right: 'right',
  center: 'center',
};

export const BACKDROP_ANIMATIONS = {
  fade: 'fade',
  none: 'none',
};

export function createDefaultConfig() {
  return {
    height: MIN_SHEET_HEIGHT,
    customStyles: {
      draggableIcon: {},
      container: {},
      draggableContainer: {},
      backdrop: {},
      overlay: {},
      handle: {},
    },
    background: DEFAULT_DIM,
    maskColor: null,
    maskOpacity: null,
    mask: null,
    duration: 280,
    closeDuration: 240,
    closeOnDragDown: true,
    closeOnPressMask: true,
    closeOnPressBack: true,
    dragTopOnly: false,
    component: null,
    keyboardHeightAdjustment: false,
    autoHeight: false,
    allowHeightShrink: true,
    maxHeight: Math.floor(HEIGHT * DEFAULT_MAX_HEIGHT_RATIO),
    zIndex: LAYER_Z.sheet,
    // New animation API
    animation: SHEET_ANIMATIONS.slide,
    from: SHEET_FROM.bottom,
    backdropAnimation: BACKDROP_ANIMATIONS.fade,
    sheetAnimation: null,
    // Optional spring knobs
    bounciness: 6,
    speed: 14,
  };
}

export function runCallback(callback, payload) {
  if (typeof callback === 'function') {
    callback(payload);
  }
}

export function clampHeight(height, maxHeight) {
  const max = maxHeight || Math.floor(HEIGHT * DEFAULT_MAX_HEIGHT_RATIO);
  return Math.min(Math.max(height, MIN_SHEET_HEIGHT), max);
}

export function resolveSheetAnimation(config = {}) {
  const nested = config.sheetAnimation && typeof config.sheetAnimation === 'object'
    ? config.sheetAnimation
    : {};

  const type = nested.type || config.animation || SHEET_ANIMATIONS.slide;
  const from = nested.from || config.from || SHEET_FROM.bottom;
  // `timing` is a deprecated alias for `duration`
  const duration = nested.duration ?? config.duration ?? config.timing ?? 280;

  return {
    type,
    from,
    duration,
    closeDuration: nested.closeDuration ?? config.closeDuration ?? 240,
    bounciness: nested.bounciness ?? config.bounciness ?? 6,
    speed: nested.speed ?? config.speed ?? 14,
  };
}

export function resolveBackdropAnimation(config = {}) {
  const nested = config.backdropAnimation && typeof config.backdropAnimation === 'object'
    ? config.backdropAnimation
    : null;
  const duration = config.duration ?? config.timing ?? 280;

  if (nested) {
    return {
      type: nested.type || BACKDROP_ANIMATIONS.fade,
      duration: nested.duration ?? duration,
      closeDuration: nested.closeDuration ?? config.closeDuration ?? 240,
    };
  }

  const type = typeof config.backdropAnimation === 'string'
    ? config.backdropAnimation
    : BACKDROP_ANIMATIONS.fade;

  return {
    type,
    duration,
    closeDuration: config.closeDuration ?? 240,
  };
}
