const TOAST_POSITIONS = {
  top: 'top',
  bottom: 'bottom',
  center: 'center',
  topLeft: 'topLeft',
  topRight: 'topRight',
  bottomLeft: 'bottomLeft',
  bottomRight: 'bottomRight',
};

const TOAST_ANIMATIONS = {
  slide: 'slide',
  fade: 'fade',
  fadeSlide: 'fadeSlide',
  spring: 'spring',
  none: 'none',
};

const TOAST_MODES = {
  stack: 'stack',
  queue: 'queue',
};

const DEFAULT_DURATION = 4000;
const DEFAULT_MAX_VISIBLE = 3;
const DEFAULT_OFFSET = 16;
const STACK_GAP = 10;

/** type → preset renk / ikon glyph */
const TYPE_PRESETS = {
  success: {
    backgroundColor: '#22C55E',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
    iconGlyph: '✓',
  },
  error: {
    backgroundColor: '#EF4444',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
    iconGlyph: '✕',
  },
  danger: {
    backgroundColor: '#EF4444',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
    iconGlyph: '✕',
  },
  warning: {
    backgroundColor: '#F59E0B',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
    iconGlyph: '⚠',
  },
  info: {
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
    iconGlyph: 'ℹ',
  },
  loading: {
    backgroundColor: '#555555',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
    iconGlyph: '…',
  },
};

function positionFromKey(position) {
  const p = position || TOAST_POSITIONS.bottom;
  const isTop = p === 'top' || p === 'topLeft' || p === 'topRight';
  const isBottom = p === 'bottom' || p === 'bottomLeft' || p === 'bottomRight';
  const isCenter = p === 'center';
  const isLeft = p === 'topLeft' || p === 'bottomLeft';
  const isRight = p === 'topRight' || p === 'bottomRight';
  return {isTop, isBottom, isCenter, isLeft, isRight, key: p};
}

/** Konumdan giriş animasyonu yönü — köşelerde dikey+yatay karışmasın diye önce üst/alt */
function animationFromForPosition(position) {
  const {isTop, isBottom, isLeft, isRight, isCenter} = positionFromKey(position);
  if (isCenter) {
    return 'center';
  }
  if (isTop) {
    return 'top';
  }
  if (isBottom && !isLeft && !isRight) {
    return 'bottom';
  }
  if (isLeft) {
    return 'left';
  }
  if (isRight) {
    return 'right';
  }
  return 'bottom';
}

module.exports = {
  TOAST_POSITIONS,
  TOAST_ANIMATIONS,
  TOAST_MODES,
  DEFAULT_DURATION,
  DEFAULT_MAX_VISIBLE,
  DEFAULT_OFFSET,
  STACK_GAP,
  TYPE_PRESETS,
  positionFromKey,
  animationFromForPosition,
};
