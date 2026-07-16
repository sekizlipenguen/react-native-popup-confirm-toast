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
