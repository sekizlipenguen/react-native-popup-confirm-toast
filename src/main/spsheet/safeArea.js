import {Dimensions, Platform} from 'react-native';

/**
 * Optional peer: react-native-safe-area-context (React Navigation ile aynı kaynak).
 * Yoksa no-op provider + Dimensions fallback.
 */
let SafeAreaProvider = ({children}) => children;
let useSafeAreaInsets = () => ({top: 0, right: 0, bottom: 0, left: 0});
let initialWindowMetrics = null;

try {
  // eslint-disable-next-line global-require
  const sac = require('react-native-safe-area-context');
  SafeAreaProvider = sac.SafeAreaProvider;
  useSafeAreaInsets = sac.useSafeAreaInsets;
  initialWindowMetrics = sac.initialWindowMetrics;
} catch (_e) {
  // peer yok — Dimensions fallback
}

/** Android 15+ 3-tuş nav tipik yüksekliği (dp). Edge-to-edge’de inset 0 gelince. */
const ANDROID15_NAV_FALLBACK = 48;

function androidApiLevel() {
  const v = Platform.Version;
  return typeof v === 'number' ? v : parseInt(String(v), 10) || 0;
}

/**
 * Bottom sheet için alt güvenli alan.
 * React Navigation BottomTabBar: paddingBottom += insets.bottom
 *
 * Modal + navigationBarTranslucent altında inset 0 gelebilir;
 * o durumda screen − window ≈ sistem nav yüksekliği (3 tuşlu Android).
 * Android 15+ edge-to-edge’de screen≈window olduğundan diff de 0 kalır → 48dp fallback.
 */
export function useSheetBottomInset(enabled) {
  const insets = useSafeAreaInsets();
  if (!enabled) {
    return 0;
  }
  if (insets.bottom > 0) {
    return insets.bottom;
  }
  if (Platform.OS === 'android') {
    const diff = Dimensions.get('screen').height - Dimensions.get('window').height;
    if (diff > 0) {
      return Math.max(0, Math.round(diff));
    }
    if (androidApiLevel() >= 35) {
      return ANDROID15_NAV_FALLBACK;
    }
  }
  return 0;
}

export {SafeAreaProvider, useSafeAreaInsets, initialWindowMetrics};
