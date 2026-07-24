import {Dimensions, Platform, StatusBar} from 'react-native';

// Cihaz Boyutları ve Status Bar Yükseklikleri
const DEVICE_SPECS = [
  {width: 375, height: 812, statusBarHeight: 44}, // iPhone X
  {width: 414, height: 896, statusBarHeight: 44}, // iPhone XS Max
  {width: 390, height: 844, statusBarHeight: 47}, // iPhone 12
  {width: 428, height: 926, statusBarHeight: 47}, // iPhone 12 Max
  {width: 393, height: 852, statusBarHeight: 49}, // iPhone 14 Pro
  {width: 430, height: 932, statusBarHeight: 49}, // iPhone 14 Pro Max
  {width: 396, height: 852, statusBarHeight: 50}, // iPhone 15
  {width: 430, height: 932, statusBarHeight: 50}, // iPhone 15 Max
  {width: 402, height: 874, statusBarHeight: 51}, // iPhone 16 Pro
  {width: 440, height: 956, statusBarHeight: 51}, // iPhone 16 Pro Max
];

const ANDROID_STATUS_FALLBACK = 24;
/** Android 15+ 3-tuş nav tipik yüksekliği (dp); edge-to-edge’de inset 0 gelince. */
const ANDROID15_NAV_FALLBACK = 48;

function androidApiLevel() {
  const v = Platform.Version;
  return typeof v === 'number' ? v : parseInt(String(v), 10) || 0;
}

function readSafeAreaTop() {
  try {
    // Optional peer — host apps (RN) almost always have it.
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const sac = require('react-native-safe-area-context');
    const top = sac.initialWindowMetrics?.insets?.top;
    if (typeof top === 'number' && top > 0) {
      return top;
    }
  } catch (_) {
    // peer yoksa StatusBar'a düş
  }
  return 0;
}

function readSafeAreaBottom() {
  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const sac = require('react-native-safe-area-context');
    const bottom = sac.initialWindowMetrics?.insets?.bottom;
    if (typeof bottom === 'number' && bottom > 0) {
      return bottom;
    }
  } catch (_) {
    // peer yok
  }
  return 0;
}

function getIOSStatusBarInfo() {
  if (Platform.OS !== 'ios' || Platform.isTVOS) {
    return {height: 0, hasNotch: false};
  }

  if (Platform.isPad) {
    return {height: 24, hasNotch: false};
  }

  const {height, width} = Dimensions.get('window');
  const shortEdge = Math.min(width, height);
  const longEdge = Math.max(width, height);
  const device = DEVICE_SPECS.find(
    spec =>
      spec.width === shortEdge &&
      spec.height === longEdge,
  );

  if (device) {
    return {height: device.statusBarHeight, hasNotch: true};
  }

  // Yeni iPhone ölçüleri listeye eklenmeden de Dynamic Island/notch altında kalma.
  if (shortEdge >= 393 && longEdge >= 852) {
    return {height: 50, hasNotch: true};
  }
  if (shortEdge >= 375 && longEdge >= 812) {
    return {height: 44, hasNotch: true};
  }

  return {height: 20, hasNotch: false};
}

// Monobrow Kontrol Fonksiyonu
export const isIPhoneWithMonobrow = () => getIOSStatusBarInfo().hasNotch;

/**
 * Status / safe-area üst inset.
 * Android Modal statusBarTranslucent iken StatusBar.currentHeight bazen 0;
 * safe-area-context + fallback ile status bar üstüne binmeyi önler.
 */
export function getStatusBarHeight(skipAndroid = false) {
  if (Platform.OS === 'ios') {
    return getIOSStatusBarInfo().height;
  }
  if (Platform.OS === 'android') {
    if (skipAndroid) {
      return 0;
    }
    const fromStatus = StatusBar.currentHeight || 0;
    const fromSafe = readSafeAreaTop();
    return Math.max(fromStatus, fromSafe, ANDROID_STATUS_FALLBACK);
  }
  return 0;
}

/**
 * Alt sistem nav / home indicator yüksekliği.
 * Android 15+ edge-to-edge’de insets.bottom ve screen−window sık 0 → 48dp fallback.
 */
export function getNavigationBarHeight() {
  if (Platform.OS === 'ios') {
    // Home indicator; notch’lu cihazlarda tipik ~34, eski modellerde 0.
    return getIOSStatusBarInfo().hasNotch ? 34 : 0;
  }
  if (Platform.OS !== 'android') {
    return 0;
  }
  const fromSafe = readSafeAreaBottom();
  if (fromSafe > 0) {
    return fromSafe;
  }
  const diff = Dimensions.get('screen').height - Dimensions.get('window').height;
  if (diff > 0) {
    return Math.round(diff);
  }
  if (androidApiLevel() >= 35) {
    return ANDROID15_NAV_FALLBACK;
  }
  return 0;
}
