import {Animated, Dimensions, Easing, Platform} from 'react-native';

const screen = Dimensions.get(Platform.OS === 'android' ? 'screen' : 'window');
const WIDTH = screen.width;
const HEIGHT = screen.height;

export const POPUP_ANIMATIONS = {
  slide: 'slide',
  fade: 'fade',
  fadeSlide: 'fadeSlide',
  spring: 'spring',
  none: 'none',
};

export const POPUP_FROM = {
  bottom: 'bottom',
  top: 'top',
  left: 'left',
  right: 'right',
  center: 'center',
};

export function resolvePopupAnimation(config = {}) {
  const nested = config.popupAnimation && typeof config.popupAnimation === 'object'
    ? config.popupAnimation
    : {};

  return {
    type: nested.type || config.animation || POPUP_ANIMATIONS.fadeSlide,
    from: nested.from || config.from || POPUP_FROM.center,
    duration: nested.duration ?? config.duration ?? 260,
    closeDuration: nested.closeDuration ?? config.closeDuration ?? 200,
    bounciness: nested.bounciness ?? config.bounciness ?? 8,
    speed: nested.speed ?? config.speed ?? 12,
  };
}

export function createPopupAnimValues() {
  return {
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(1),
  };
}

function getHiddenOffset(from) {
  switch (from) {
    case POPUP_FROM.top:
      return {x: 0, y: -Math.min(HEIGHT * 0.25, 160)};
    case POPUP_FROM.bottom:
      return {x: 0, y: Math.min(HEIGHT * 0.25, 160)};
    case POPUP_FROM.left:
      return {x: -Math.min(WIDTH * 0.35, 140), y: 0};
    case POPUP_FROM.right:
      return {x: Math.min(WIDTH * 0.35, 140), y: 0};
    case POPUP_FROM.center:
    default:
      return {x: 0, y: 0};
  }
}

export function resetPopupHidden(values, anim) {
  const offset = getHiddenOffset(anim.from);
  values.translateX.setValue(offset.x);
  values.translateY.setValue(offset.y);
  values.panX?.setValue?.(0);
  values.panY?.setValue?.(0);

  if (
    anim.type === POPUP_ANIMATIONS.fade ||
    anim.type === POPUP_ANIMATIONS.fadeSlide ||
    anim.from === POPUP_FROM.center
  ) {
    values.opacity.setValue(0);
  } else {
    values.opacity.setValue(1);
  }

  if (anim.from === POPUP_FROM.center || anim.type === POPUP_ANIMATIONS.spring) {
    values.scale.setValue(anim.type === POPUP_ANIMATIONS.none ? 1 : 0.92);
  } else {
    values.scale.setValue(1);
  }
}

function timing(value, toValue, duration, easing = Easing.out(Easing.cubic)) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
}

export function buildPopupOpen(values, anim) {
  const {type, from, duration, bounciness, speed} = anim;

  if (type === POPUP_ANIMATIONS.none) {
    values.translateX.setValue(0);
    values.translateY.setValue(0);
    values.opacity.setValue(1);
    values.scale.setValue(1);
    return null;
  }

  const animations = [];

  if (type === POPUP_ANIMATIONS.fade) {
    values.translateX.setValue(0);
    values.translateY.setValue(0);
    values.scale.setValue(1);
    animations.push(timing(values.opacity, 1, duration, Easing.out(Easing.ease)));
    return Animated.parallel(animations);
  }

  if (type === POPUP_ANIMATIONS.spring) {
    animations.push(
      Animated.spring(values.translateX, {toValue: 0, useNativeDriver: true, bounciness, speed}),
      Animated.spring(values.translateY, {toValue: 0, useNativeDriver: true, bounciness, speed}),
      Animated.spring(values.scale, {toValue: 1, useNativeDriver: true, bounciness, speed}),
    );
    if (from === POPUP_FROM.center || type === POPUP_ANIMATIONS.fadeSlide) {
      animations.push(timing(values.opacity, 1, Math.min(duration, 180)));
    } else {
      values.opacity.setValue(1);
    }
    return Animated.parallel(animations);
  }

  // slide / fadeSlide
  animations.push(
    timing(values.translateX, 0, duration),
    timing(values.translateY, 0, duration),
  );

  if (type === POPUP_ANIMATIONS.fadeSlide || from === POPUP_FROM.center) {
    animations.push(timing(values.opacity, 1, duration, Easing.out(Easing.ease)));
    animations.push(timing(values.scale, 1, duration, Easing.out(Easing.cubic)));
  } else {
    values.opacity.setValue(1);
    values.scale.setValue(1);
  }

  return Animated.parallel(animations);
}

export function buildPopupClose(values, anim) {
  const {type, from, closeDuration} = anim;
  const offset = getHiddenOffset(from);

  if (type === POPUP_ANIMATIONS.none) {
    values.translateX.setValue(offset.x);
    values.translateY.setValue(offset.y);
    values.opacity.setValue(0);
    values.scale.setValue(0.92);
    return null;
  }

  const animations = [];

  if (type === POPUP_ANIMATIONS.fade) {
    animations.push(timing(values.opacity, 0, closeDuration, Easing.in(Easing.ease)));
    return Animated.parallel(animations);
  }

  animations.push(
    timing(values.translateX, offset.x, closeDuration, Easing.in(Easing.cubic)),
    timing(values.translateY, offset.y, closeDuration, Easing.in(Easing.cubic)),
  );

  if (type === POPUP_ANIMATIONS.fadeSlide || from === POPUP_FROM.center || type === POPUP_ANIMATIONS.spring) {
    animations.push(timing(values.opacity, 0, closeDuration, Easing.in(Easing.ease)));
    animations.push(timing(values.scale, 0.92, closeDuration, Easing.in(Easing.cubic)));
  }

  return Animated.parallel(animations);
}

export function getPopupTransformStyle(values) {
  return {
    opacity: values.opacity,
    transform: [
      {translateX: values.translateX},
      {translateY: values.translateY},
      {scale: values.scale},
    ],
  };
}
