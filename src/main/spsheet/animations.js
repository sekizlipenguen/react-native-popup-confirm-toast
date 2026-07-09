import {Animated, Easing} from 'react-native';
import {HEIGHT, WIDTH, SHEET_ANIMATIONS, SHEET_FROM, BACKDROP_ANIMATIONS} from './constants';

export function getHiddenOffset(from, size) {
  const travel = Math.max(size || 0, 120);
  switch (from) {
    case SHEET_FROM.top:
      return {x: 0, y: -travel};
    case SHEET_FROM.left:
      return {x: -WIDTH, y: 0};
    case SHEET_FROM.right:
      return {x: WIDTH, y: 0};
    case SHEET_FROM.center:
      return {x: 0, y: 0};
    case SHEET_FROM.bottom:
    default:
      return {x: 0, y: travel};
  }
}

export function createSheetAnimValues() {
  return {
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(HEIGHT),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(1),
    panX: new Animated.Value(0),
    panY: new Animated.Value(0),
  };
}

export function createBackdropAnimValue() {
  return new Animated.Value(0);
}

export function resetSheetHidden(values, sheetAnim, height) {
  const offset = getHiddenOffset(sheetAnim.from, height);
  values.translateX.setValue(offset.x);
  values.translateY.setValue(offset.y);
  values.panX.setValue(0);
  values.panY.setValue(0);

  if (sheetAnim.type === SHEET_ANIMATIONS.fade || sheetAnim.type === SHEET_ANIMATIONS.fadeSlide) {
    values.opacity.setValue(0);
  } else if (sheetAnim.type === SHEET_ANIMATIONS.none && sheetAnim.from === SHEET_FROM.center) {
    values.opacity.setValue(0);
    values.scale.setValue(0.96);
  } else {
    values.opacity.setValue(1);
  }

  if (sheetAnim.from === SHEET_FROM.center) {
    values.scale.setValue(sheetAnim.type === SHEET_ANIMATIONS.none ? 1 : 0.94);
  } else {
    values.scale.setValue(1);
  }
}

export function resetBackdropHidden(backdropOpacity, backdropAnim) {
  backdropOpacity.setValue(backdropAnim.type === BACKDROP_ANIMATIONS.none ? 1 : 0);
}

function timing(value, toValue, duration, easing = Easing.out(Easing.cubic), useNativeDriver = true) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing,
    useNativeDriver,
  });
}

/**
 * Backdrop: on Fabric Modal, opacity animation is unreliable.
 * We still drive the Animated.Value for API compatibility, but SPSheet paints
 * a STATIC dim on the root overlay (explicit WIDTH×HEIGHT + backgroundColor).
 * Sheet motion (translate/opacity/scale) keeps useNativeDriver: true.
 */
export function buildOpenAnimations(values, backdropOpacity, sheetAnim, backdropAnim) {
  const animations = [];

  // Keep value in sync; visual dim is static on the overlay View.
  backdropOpacity.setValue(1);

  const {type, from, duration, bounciness, speed} = sheetAnim;

  if (type === SHEET_ANIMATIONS.none) {
    values.translateX.setValue(0);
    values.translateY.setValue(0);
    values.opacity.setValue(1);
    values.scale.setValue(1);
    return animations.length ? Animated.parallel(animations) : null;
  }

  if (type === SHEET_ANIMATIONS.fade) {
    values.translateX.setValue(0);
    values.translateY.setValue(0);
    values.scale.setValue(1);
    animations.push(timing(values.opacity, 1, duration, Easing.out(Easing.ease)));
    return Animated.parallel(animations);
  }

  if (type === SHEET_ANIMATIONS.spring) {
    animations.push(
      Animated.spring(values.translateX, {
        toValue: 0,
        useNativeDriver: true,
        bounciness,
        speed,
      }),
      Animated.spring(values.translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness,
        speed,
      }),
    );
    if (from === SHEET_FROM.center) {
      animations.push(
        Animated.spring(values.scale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness,
          speed,
        }),
      );
      animations.push(timing(values.opacity, 1, Math.min(duration, 180)));
    } else {
      values.opacity.setValue(1);
      values.scale.setValue(1);
    }
    return Animated.parallel(animations);
  }

  // slide / fadeSlide
  animations.push(
    timing(values.translateX, 0, duration),
    timing(values.translateY, 0, duration),
  );

  if (type === SHEET_ANIMATIONS.fadeSlide || from === SHEET_FROM.center) {
    animations.push(timing(values.opacity, 1, duration, Easing.out(Easing.ease)));
  } else {
    values.opacity.setValue(1);
  }

  if (from === SHEET_FROM.center) {
    animations.push(timing(values.scale, 1, duration, Easing.out(Easing.cubic)));
  } else {
    values.scale.setValue(1);
  }

  return Animated.parallel(animations);
}

export function buildCloseAnimations(values, backdropOpacity, sheetAnim, backdropAnim, height) {
  const animations = [];
  const offset = getHiddenOffset(sheetAnim.from, height);
  const {type, from, closeDuration} = sheetAnim;

  // Visual dim stays until Modal unmounts; value reset for next open.
  backdropOpacity.setValue(0);

  if (type === SHEET_ANIMATIONS.none) {
    values.translateX.setValue(offset.x);
    values.translateY.setValue(offset.y);
    values.opacity.setValue(0);
    return animations.length ? Animated.parallel(animations) : null;
  }

  if (type === SHEET_ANIMATIONS.fade) {
    animations.push(timing(values.opacity, 0, closeDuration, Easing.in(Easing.ease)));
    return Animated.parallel(animations);
  }

  animations.push(
    timing(values.translateX, offset.x, closeDuration, Easing.in(Easing.cubic)),
    timing(values.translateY, offset.y, closeDuration, Easing.in(Easing.cubic)),
  );

  if (type === SHEET_ANIMATIONS.fadeSlide || from === SHEET_FROM.center) {
    animations.push(timing(values.opacity, 0, closeDuration, Easing.in(Easing.ease)));
  }

  if (from === SHEET_FROM.center) {
    animations.push(timing(values.scale, 0.94, closeDuration, Easing.in(Easing.cubic)));
  }

  return Animated.parallel(animations);
}

export function getSheetTransformStyle(values) {
  return {
    opacity: values.opacity,
    transform: [
      {translateX: Animated.add(values.translateX, values.panX)},
      {translateY: Animated.add(values.translateY, values.panY)},
      {scale: values.scale},
    ],
  };
}
