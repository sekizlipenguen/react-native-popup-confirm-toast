import React, {Component} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import OverlayBus from './OverlayBus';
import {DEFAULT_DIM, resolveMaskColor} from './shared/mask';
import {
  POPUP_ANIMATIONS,
  POPUP_FROM,
  buildPopupClose,
  buildPopupOpen,
  createPopupAnimValues,
  getPopupTransformStyle,
  resetPopupHidden,
  resolvePopupAnimation,
} from './popup/animations';

const PRIMARY = '#D6001F';
const PRIMARY_PRESSED = '#B8001A';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const BORDER = '#E5E5E5';
const SURFACE = '#FFFFFF';
/** Default above SPSheet (sheet=10). Pass `zIndex` in Popup.show to override. */
const DEFAULT_POPUP_Z = 100;

function getWindowSize() {
  const screen = Dimensions.get(Platform.OS === 'android' ? 'screen' : 'window');
  return {width: screen.width, height: screen.height};
}

/** Presentational card — used by Modal host and by in-sheet portal. */
export function PopupCard({
  title,
  textBody,
  type,
  iconEnabled,
  icon,
  iconHeaderStyle,
  titleTextStyle,
  descTextStyle,
  bodyComponent: BodyComponent,
  bodyComponentForce,
  modalContainerStyle,
  buttonEnabled,
  buttonText,
  confirmText,
  buttonContentStyle,
  okButtonStyle,
  confirmButtonStyle,
  okButtonTextStyle,
  confirmButtonTextStyle,
  onPrimaryPress,
  onCancelPress,
  extraProps,
}) {
  const resolveIcon = () => {
    if (icon) {
      return icon;
    }
    switch (type) {
      case 'success':
        return require('../assets/success.png');
      case 'danger':
      case 'error':
        return require('../assets/error.png');
      case 'warning':
      case 'confirm':
      default:
        return require('../assets/warning.png');
    }
  };

  if (bodyComponentForce && BodyComponent) {
    return (
      <View style={[styles.card, modalContainerStyle]} testID="popup-card">
        <BodyComponent {...(extraProps || {})} />
      </View>
    );
  }

  return (
    <View style={[styles.card, modalContainerStyle]} testID="popup-card">
      {iconEnabled ? (
        <View style={styles.iconWrap}>
          <View style={[styles.iconSpacer, iconHeaderStyle]} />
          <Image source={resolveIcon()} resizeMode="contain" style={styles.icon} />
        </View>
      ) : null}

      <View style={[styles.content, !iconEnabled && styles.contentCompact]}>
        {title ? (
          <Text style={[styles.title, titleTextStyle]} testID="popup-title">
            {title}
          </Text>
        ) : null}
        {textBody ? (
          <Text style={[styles.desc, descTextStyle]} testID="popup-body">
            {textBody}
          </Text>
        ) : null}
        {BodyComponent ? <BodyComponent {...(extraProps || {})} /> : null}

        {buttonEnabled ? (
          type === 'confirm' ? (
            <View style={[styles.buttonRow, buttonContentStyle]} testID="popup-confirm-buttons">
              <Pressable
                testID="popup-cancel-button"
                style={({pressed}) => [
                  styles.button,
                  styles.cancelButton,
                  confirmButtonStyle,
                  pressed && styles.cancelPressed,
                ]}
                onPress={onCancelPress}
              >
                <Text style={[styles.cancelText, confirmButtonTextStyle]} numberOfLines={1}>
                  {confirmText}
                </Text>
              </Pressable>
              <Pressable
                testID="popup-ok-button"
                style={({pressed}) => [
                  styles.button,
                  styles.primaryButton,
                  okButtonStyle,
                  pressed && styles.primaryPressed,
                ]}
                onPress={onPrimaryPress}
              >
                <Text style={[styles.primaryText, okButtonTextStyle]} numberOfLines={1}>
                  {buttonText}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.buttonRow, styles.buttonRowSingle, buttonContentStyle]}>
              <Pressable
                testID="popup-ok-button"
                style={({pressed}) => [
                  styles.button,
                  styles.primaryButton,
                  okButtonStyle,
                  pressed && styles.primaryPressed,
                ]}
                onPress={onPrimaryPress}
              >
                <Text style={[styles.primaryText, okButtonTextStyle]} numberOfLines={1}>
                  {buttonText}
                </Text>
              </Pressable>
            </View>
          )
        ) : null}
      </View>
    </View>
  );
}

/**
 * Animated card wrapper — mask stays static; only the card moves/fades.
 */
class AnimatedPopupCard extends Component {
  constructor(props) {
    super(props);
    this.values = createPopupAnimValues();
    this.closing = false;
    this.animKey = 0;
  }

  componentDidMount() {
    this.playOpen();
  }

  componentDidUpdate(prevProps) {
    if (this.props.dismissToken !== prevProps.dismissToken && this.props.dismissToken) {
      this.playClose();
      return;
    }
    if (this.props.animKey !== prevProps.animKey) {
      this.playOpen();
    }
  }

  playOpen = () => {
    this.closing = false;
    const anim = resolvePopupAnimation(this.props.config || {});
    resetPopupHidden(this.values, anim);
    const driver = buildPopupOpen(this.values, anim);
    if (driver) {
      driver.start();
    }
  };

  playClose = () => {
    if (this.closing) {
      return;
    }
    this.closing = true;
    const anim = resolvePopupAnimation(this.props.config || {});
    const driver = buildPopupClose(this.values, anim);
    const finish = () => {
      this.closing = false;
      if (typeof this.props.onCloseAnimationComplete === 'function') {
        this.props.onCloseAnimationComplete();
      }
    };
    if (driver) {
      driver.start(finish);
    } else {
      finish();
    }
  };

  render() {
    const {config, onPrimaryPress, onCancelPress, extraProps} = this.props;
    return (
      <Animated.View style={getPopupTransformStyle(this.values)}>
        <PopupCard
          {...config}
          onPrimaryPress={onPrimaryPress}
          onCancelPress={onCancelPress}
          extraProps={extraProps}
        />
      </Animated.View>
    );
  }
}

/**
 * Renders inside SPSheet Modal so alerts appear above the sheet on iOS.
 * Dim: Fabric-safe static color. Card: animated.
 */
export class PopupPortal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      config: OverlayBus.get(),
      dismissToken: 0,
      animKey: 0,
    };
  }

  componentDidMount() {
    this.unsubscribe = OverlayBus.subscribe(config => {
      if (!config) {
        this.setState({config: null, dismissToken: 0});
        return;
      }
      if (config.__dismissing) {
        this.setState(prev => ({
          config: {...config, __dismissing: undefined},
          dismissToken: prev.dismissToken + 1,
        }));
        return;
      }
      this.setState(prev => ({
        config,
        animKey: prev.animKey + 1,
        dismissToken: 0,
      }));
    });
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  onPrimaryPress = () => {
    const config = this.state.config;
    if (!config) {
      return;
    }
    if (typeof config.callback === 'function') {
      config.callback();
      return;
    }
    Popup.hide();
  };

  onCancelPress = () => {
    const config = this.state.config;
    if (!config) {
      return;
    }
    if (typeof config.cancelCallback === 'function') {
      config.cancelCallback();
      return;
    }
    Popup.hide();
  };

  onCloseAnimationComplete = () => {
    Popup.finishDismiss();
  };

  render() {
    const {config, dismissToken, animKey} = this.state;
    if (!config) {
      return null;
    }

    const dimColor = resolveMaskColor(config);
    const layerZ = Number.isFinite(config.zIndex) ? config.zIndex : DEFAULT_POPUP_Z;
    const {width, height} = getWindowSize();
    const closeOnPressMask = config.closeOnPressMask !== false;

    return (
      <View
        style={[
          styles.portalRoot,
          {
            width,
            height,
            zIndex: layerZ,
            elevation: Math.max(40, layerZ),
          },
        ]}
        testID="popup-root"
        pointerEvents="box-none"
        collapsable={false}
      >
        {/* Static mask — color/opacity from config; NEVER animated */}
        <Pressable
          testID="popup-mask"
          accessibilityRole="button"
          accessibilityLabel="Close popup"
          pointerEvents="auto"
          disabled={!closeOnPressMask}
          onPress={() => {
            if (closeOnPressMask) {
              Popup.hide();
            }
          }}
          style={[
            styles.portalDim,
            {
              width,
              height,
              backgroundColor: dimColor,
            },
          ]}
        />
        <View style={styles.portalCenter} pointerEvents="box-none">
          <AnimatedPopupCard
            config={config}
            animKey={animKey}
            dismissToken={dismissToken}
            onPrimaryPress={this.onPrimaryPress}
            onCancelPress={this.onCancelPress}
            onCloseAnimationComplete={this.onCloseAnimationComplete}
          />
        </View>
      </View>
    );
  }
}

class Popup extends Component {
  static popupInstance;
  static POPUP_ANIMATIONS = POPUP_ANIMATIONS;
  static POPUP_FROM = POPUP_FROM;

  constructor(props) {
    super(props);

    const {width, height} = getWindowSize();
    this.width = width;
    this.height = height;
    this.autoHideTimer = null;
    this.pendingCloseComplete = null;
    this.modalAnimKey = 0;
    this.modalDismissToken = 0;
    this.state = this.createIdleState();
  }

  createIdleState() {
    return {
      open: false,
      title: '',
      type: 'warning',
      buttonEnabled: true,
      textBody: '',
      bodyComponent: null,
      bodyComponentForce: false,
      buttonText: 'Ok',
      confirmText: 'Cancel',
      callback: null,
      cancelCallback: null,
      background: DEFAULT_DIM,
      maskColor: null,
      maskOpacity: null,
      mask: null,
      timing: 0,
      iconEnabled: true,
      icon: null,
      iconHeaderStyle: null,
      containerStyle: null,
      modalContainerStyle: null,
      buttonContentStyle: null,
      okButtonStyle: null,
      confirmButtonStyle: null,
      okButtonTextStyle: null,
      confirmButtonTextStyle: null,
      titleTextStyle: null,
      descTextStyle: null,
      onOpen: null,
      onOpenComplete: null,
      onClose: null,
      onCloseComplete: null,
      zIndex: DEFAULT_POPUP_Z,
      viaPortal: false,
      closeOnPressMask: true,
      // Card animation
      animation: POPUP_ANIMATIONS.fadeSlide,
      from: POPUP_FROM.center,
      duration: 260,
      closeDuration: 200,
      bounciness: 8,
      speed: 12,
      popupAnimation: null,
      animKey: 0,
      dismissToken: 0,
    };
  }

  static show(config = {}) {
    if (!this.popupInstance) {
      console.warn('[Popup] Root is not mounted yet');
      return;
    }
    this.popupInstance.present(config);
  }

  static hide() {
    this.popupInstance?.dismiss();
  }

  /** Immediate close (no exit animation) — used for PIP / app-state cleanup. */
  static forceHide() {
    this.popupInstance?.forceHide();
  }

  /** Called by portal / modal card after close animation finishes. */
  static finishDismiss() {
    this.popupInstance?.completeDismiss();
  }

  componentDidMount() {
    this.dimensionsSubscription = Dimensions.addEventListener('change', this.onDimensionsChange);
  }

  componentWillUnmount() {
    this.dimensionsSubscription?.remove?.();
    this.clearAutoHide();
  }

  syncWindowSize = (nextWidth, nextHeight) => {
    const {width, height} =
      nextWidth != null && nextHeight != null
        ? {width: nextWidth, height: nextHeight}
        : getWindowSize();
    if (!(width > 0 && height > 0)) {
      return false;
    }
    if (this.width === width && this.height === height) {
      return false;
    }
    this.width = width;
    this.height = height;
    return true;
  };

  onDimensionsChange = () => {
    if (this.syncWindowSize() && this.state.open) {
      this.forceUpdate();
    }
  };

  onModalRootLayout = event => {
    const {width, height} = event?.nativeEvent?.layout || {};
    if (this.syncWindowSize(width, height) && this.state.open) {
      this.forceUpdate();
    }
  };

  clearAutoHide() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  normalizeConfig(config = {}) {
    const type = config.type || 'warning';
    const next = {...config};

    if (next.confirmText == null && next.cancelButtonText != null) {
      next.confirmText = next.cancelButtonText;
    }
    if (type === 'confirm' && next.iconEnabled === undefined) {
      next.iconEnabled = false;
    }

    const anim = resolvePopupAnimation(next);

    return {
      ...this.createIdleState(),
      ...next,
      type,
      open: true,
      title: next.title || '',
      textBody: next.textBody || '',
      buttonText: next.buttonText || 'Ok',
      confirmText: next.confirmText || 'Cancel',
      background: next.background || DEFAULT_DIM,
      maskColor: next.maskColor ?? null,
      maskOpacity: next.maskOpacity ?? next.opacity ?? null,
      mask: next.mask && typeof next.mask === 'object' ? next.mask : null,
      iconEnabled: next.iconEnabled !== false,
      buttonEnabled: next.buttonEnabled !== false,
      bodyComponent: next.bodyComponent || null,
      bodyComponentForce: next.bodyComponentForce === true,
      zIndex: Number.isFinite(next.zIndex) ? next.zIndex : DEFAULT_POPUP_Z,
      closeOnPressMask: next.closeOnPressMask !== false,
      animation: anim.type,
      from: anim.from,
      duration: anim.duration,
      closeDuration: anim.closeDuration,
      bounciness: anim.bounciness,
      speed: anim.speed,
    };
  }

  present(config = {}) {
    this.clearAutoHide();
    this.pendingCloseComplete = null;
    // Always re-read size at show time (tablet launch landscape → forced portrait).
    this.syncWindowSize();
    const normalized = this.normalizeConfig(config);

    const usePortal = OverlayBus.isHostActive() || OverlayBus.hasListener();

    if (usePortal) {
      normalized.viaPortal = true;
      normalized.open = false;
      this.modalAnimKey += 1;
      this.setState(normalized, () => {
        OverlayBus.show(normalized);
        if (typeof normalized.onOpen === 'function') {
          normalized.onOpen();
        }
        if (typeof normalized.onOpenComplete === 'function') {
          normalized.onOpenComplete();
        }
        if (normalized.timing) {
          const ms = normalized.timing > 0 ? normalized.timing : 5000;
          this.autoHideTimer = setTimeout(() => this.dismiss(), ms);
        }
      });
      return;
    }

    OverlayBus.hide();
    normalized.viaPortal = false;
    this.modalAnimKey += 1;
    normalized.animKey = this.modalAnimKey;
    normalized.dismissToken = 0;
    this.setState(normalized, () => {
      if (typeof this.state.onOpen === 'function') {
        this.state.onOpen();
      }
      if (typeof this.state.onOpenComplete === 'function') {
        this.state.onOpenComplete();
      }
      if (this.state.timing) {
        const ms = this.state.timing > 0 ? this.state.timing : 5000;
        this.autoHideTimer = setTimeout(() => this.dismiss(), ms);
      }
    });
  }

  dismiss = () => {
    const wasOpen = this.state.open || this.state.viaPortal;
    if (!wasOpen && !OverlayBus.get()) {
      return;
    }

    this.clearAutoHide();
    const {onClose, onCloseComplete, viaPortal} = this.state;
    this.pendingCloseComplete = onCloseComplete;

    if (typeof onClose === 'function') {
      onClose();
    }

    // Sheet already tearing down / bus cleared — skip card exit anim.
    if (viaPortal && !OverlayBus.get() && !OverlayBus.isHostActive()) {
      this.completeDismiss();
      return;
    }

    if (viaPortal || (OverlayBus.isHostActive() && OverlayBus.get())) {
      const current = OverlayBus.get() || this.state;
      OverlayBus.show({...current, __dismissing: true});
      return;
    }

    // Modal path — animate card out, then unmount
    this.modalDismissToken += 1;
    this.setState({dismissToken: this.modalDismissToken});
  };

  completeDismiss = () => {
    OverlayBus.hide();
    const onCloseComplete = this.pendingCloseComplete;
    this.pendingCloseComplete = null;
    this.setState(this.createIdleState(), () => {
      if (typeof onCloseComplete === 'function') {
        onCloseComplete();
      }
    });
  };

  /** Drop Modal/portal immediately without running close animation. */
  forceHide = () => {
    this.clearAutoHide();
    this.pendingCloseComplete = null;
    OverlayBus.hide();
    if (this.state.open || this.state.viaPortal || OverlayBus.get()) {
      this.setState(this.createIdleState());
    }
  };

  start = (config) => {
    this.present(config);
  };

  hidePopup = () => {
    this.dismiss();
  };

  onPrimaryPress = () => {
    const {callback} = this.state;
    if (typeof callback === 'function') {
      callback();
      return;
    }
    this.dismiss();
  };

  onCancelPress = () => {
    const {cancelCallback} = this.state;
    if (typeof cancelCallback === 'function') {
      cancelCallback();
      return;
    }
    this.dismiss();
  };

  render() {
    const {
      open,
      containerStyle,
      viaPortal,
      animKey,
      dismissToken,
      closeOnPressMask,
    } = this.state;

    if (viaPortal || !open) {
      return null;
    }

    const dimColor = resolveMaskColor(this.state);

    return (
      <Modal
        visible
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        hardwareAccelerated
        onRequestClose={this.dismiss}
      >
        <View
          testID="popup-root"
          onLayout={this.onModalRootLayout}
          style={[
            styles.root,
            {
              width: this.width,
              height: this.height,
            },
            containerStyle,
          ]}
        >
          {/* Static mask — never animated */}
          <Pressable
            testID="popup-mask"
            accessibilityRole="button"
            accessibilityLabel="Close popup"
            disabled={closeOnPressMask === false}
            onPress={() => {
              if (closeOnPressMask !== false) {
                this.dismiss();
              }
            }}
            style={[
              styles.modalDim,
              {
                width: this.width,
                height: this.height,
                backgroundColor: dimColor,
              },
            ]}
          />
          <View style={styles.center} pointerEvents="box-none">
            <AnimatedPopupCard
              config={this.state}
              animKey={animKey}
              dismissToken={dismissToken}
              onPrimaryPress={this.onPrimaryPress}
              onCancelPress={this.onCancelPress}
              onCloseAnimationComplete={this.completeDismiss}
              extraProps={this.props}
            />
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDim: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  center: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  portalRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  portalDim: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  portalCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: SURFACE,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 24,
  },
  iconWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: {
    height: 72,
    width: 100,
    backgroundColor: SURFACE,
  },
  icon: {
    width: 44,
    height: 44,
    position: 'absolute',
    top: 20,
  },
  content: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  contentCompact: {
    paddingTop: 24,
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },
  desc: {
    color: TEXT_SECONDARY,
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  buttonRowSingle: {
    marginTop: 20,
  },
  button: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
  },
  primaryButton: {
    backgroundColor: PRIMARY,
  },
  primaryPressed: {
    backgroundColor: PRIMARY_PRESSED,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cancelPressed: {
    backgroundColor: '#F0F0F0',
  },
  cancelText: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export {POPUP_ANIMATIONS, POPUP_FROM};
export default Popup;
