import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  BackHandler,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Popup, {PopupPortal} from '../Popup';
import OverlayBus from '../OverlayBus';
import {
  BACKDROP_ANIMATIONS,
  DEFAULT_DIM,
  DEFAULT_MAX_HEIGHT_RATIO,
  HEIGHT,
  LAYER_Z,
  MIN_SHEET_HEIGHT,
  IOS_KEYBOARD_OVERLAP,
  SHEET_ANIMATIONS,
  SHEET_FROM,
  WIDTH,
  clampHeight,
  createDefaultConfig,
  resolveBackdropAnimation,
  resolveSheetAnimation,
  runCallback,
} from './constants';
import {resolveMaskColor} from '../shared/mask';
import {
  buildCloseAnimations,
  buildOpenAnimations,
  createBackdropAnimValue,
  createSheetAnimValues,
  getSheetTransformStyle,
  resetBackdropHidden,
  resetSheetHidden,
} from './animations';
import {
  SafeAreaProvider,
  initialWindowMetrics,
  useSheetBottomInset,
} from './safeArea';

function useLatest(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/**
 * Modal içinde ayrı SafeAreaProvider altında çalışır (RN Modal yeni window).
 * BottomTabBar gibi: alt sheet’e insets.bottom pad + height’e ekler.
 */
function SheetFrame({
  sheetAnim,
  sheetHeightStyle,
  sheetValues,
  keyboardGapFill,
  config,
  dragHandlers,
  handleHandlers,
  isEdgeSheet,
  BodyComponent,
  height,
  keyboardInset,
  measuring,
  childrenHandleTop,
  childrenHandleBottom,
}) {
  const bottomInset = useSheetBottomInset(sheetAnim.from === SHEET_FROM.bottom);
  // Ölçüm sırasında pad ekleme — yoksa measuredHeight + display’de çift sayılır.
  const applyInset = !measuring && bottomInset > 0;
  const heightStyle = useMemo(() => {
    if (!sheetHeightStyle || !sheetHeightStyle.height) {
      return sheetHeightStyle;
    }
    if (!applyInset) {
      return sheetHeightStyle;
    }
    return {...sheetHeightStyle, height: sheetHeightStyle.height + bottomInset};
  }, [applyInset, bottomInset, sheetHeightStyle]);

  return (
    <Animated.View
      {...(dragHandlers || {})}
      style={[
        styles.container,
        sheetAnim.from === SHEET_FROM.top && styles.containerTop,
        sheetAnim.from === SHEET_FROM.left && styles.containerSide,
        sheetAnim.from === SHEET_FROM.right && styles.containerSide,
        sheetAnim.from === SHEET_FROM.center && styles.containerCenter,
        heightStyle,
        getSheetTransformStyle(sheetValues),
        {
          overflow: keyboardGapFill > 0 ? 'visible' : 'hidden',
          paddingBottom: applyInset ? bottomInset : undefined,
        },
        config.customStyles?.container,
      ]}
    >
      {childrenHandleTop}
      {childrenHandleBottom}
      {BodyComponent ? (
        <BodyComponent
          sheetProps={{
            sheetHeight: height,
            keyboardInset,
            measuring,
            bottomInset,
            animation: sheetAnim,
            from: sheetAnim.from,
          }}
        />
      ) : null}
      {Platform.OS === 'ios' && keyboardGapFill > 0 && sheetAnim.from === SHEET_FROM.bottom ? (
        <View
          pointerEvents="none"
          style={[
            styles.keyboardGapFill,
            {
              height: keyboardGapFill,
              bottom: -keyboardGapFill,
            },
          ]}
        />
      ) : null}
    </Animated.View>
  );
}

/**
 * Hook-based SPSheet host.
 * Keeps static API: SPSheet.show / hide / setHeight / reportContentHeight
 */
const SPSheetHost = forwardRef(function SPSheetHost(_props, ref) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(() => createDefaultConfig());
  const [height, setHeight] = useState(MIN_SHEET_HEIGHT);
  const [measuring, setMeasuring] = useState(false);
  const [start, setStart] = useState(false);
  const [keyboardGapFill, setKeyboardGapFill] = useState(0);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const sheetValues = useRef(createSheetAnimValues()).current;
  const backdropOpacity = useRef(createBackdropAnimValue()).current;

  const flags = useRef({
    openAnimationComplete: false,
    openAnimationInProgress: false,
    closeAnimationInProgress: false,
    measuredHeight: null,
    pendingHeight: null,
    pendingHeightCallback: null,
    measureFallbackTimer: null,
    onOpen: null,
    onOpenComplete: null,
    onClose: null,
    onCloseComplete: null,
  }).current;

  const configRef = useLatest(config);
  const heightRef = useLatest(height);
  const openRef = useLatest(open);
  const measuringRef = useLatest(measuring);

  const sheetAnim = useMemo(() => resolveSheetAnimation(config), [config]);
  const backdropAnim = useMemo(() => resolveBackdropAnimation(config), [config]);

  const clearMeasureFallback = useCallback(() => {
    if (flags.measureFallbackTimer) {
      clearTimeout(flags.measureFallbackTimer);
      flags.measureFallbackTimer = null;
    }
  }, [flags]);

  const hideInternal = useCallback(() => {
    if (!openRef.current || flags.closeAnimationInProgress) {
      return;
    }

    OverlayBus.setHostActive(false);
    OverlayBus.hide();
    try {
      // Immediate clear — do not run popup exit anim while sheet Modal tears down.
      Popup.finishDismiss();
    } catch (_e) {
      // ignore
    }

    flags.closeAnimationInProgress = true;
    flags.openAnimationInProgress = false;
    clearMeasureFallback();

    const onClose = flags.onClose;
    const onCloseComplete = flags.onCloseComplete;
    runCallback(onClose);

    sheetValues.translateX.stopAnimation();
    sheetValues.translateY.stopAnimation();
    sheetValues.opacity.stopAnimation();
    sheetValues.scale.stopAnimation();
    sheetValues.panX.stopAnimation();
    sheetValues.panY.stopAnimation();
    backdropOpacity.stopAnimation();

    const closeDriver = buildCloseAnimations(
      sheetValues,
      backdropOpacity,
      resolveSheetAnimation(configRef.current),
      resolveBackdropAnimation(configRef.current),
      heightRef.current,
    );

    const finish = () => {
      flags.openAnimationComplete = false;
      flags.openAnimationInProgress = false;
      flags.closeAnimationInProgress = false;
      flags.pendingHeight = null;
      flags.pendingHeightCallback = null;
      flags.measuredHeight = null;
      flags.onOpen = null;
      flags.onOpenComplete = null;
      flags.onClose = null;
      flags.onCloseComplete = null;

      sheetValues.panX.setValue(0);
      sheetValues.panY.setValue(0);
      setKeyboardInset(0);
      setKeyboardGapFill(0);
      setMeasuring(false);
      setStart(false);
      setOpen(false);
      setHeight(MIN_SHEET_HEIGHT);
      setConfig(createDefaultConfig());

      runCallback(onCloseComplete);
    };

    if (closeDriver) {
      closeDriver.start(() => finish());
    } else {
      finish();
    }
  }, [
    backdropOpacity,
    clearMeasureFallback,
    configRef,
    flags,
    heightRef,
    openRef,
    sheetValues,
  ]);

  const applyHeightInternal = useCallback((nextHeight, completeEvent) => {
    const maxHeight = configRef.current.maxHeight || Math.floor(HEIGHT * DEFAULT_MAX_HEIGHT_RATIO);
    const clamped = clampHeight(nextHeight, maxHeight);
    const allowShrink = configRef.current.allowHeightShrink !== false;
    const current = heightRef.current;

    if (!allowShrink && clamped < current) {
      runCallback(completeEvent);
      return;
    }
    if (Math.abs(clamped - current) < 2) {
      runCallback(completeEvent);
      return;
    }

    setHeight(clamped);
    setStart(false);
    runCallback(completeEvent);
  }, [configRef, heightRef]);

  const startOpenAnimation = useCallback(() => {
    if (flags.openAnimationInProgress || flags.openAnimationComplete || flags.closeAnimationInProgress) {
      return;
    }

    flags.openAnimationInProgress = true;
    setStart(false);

    const currentSheetAnim = resolveSheetAnimation(configRef.current);
    const currentBackdropAnim = resolveBackdropAnimation(configRef.current);

    resetSheetHidden(sheetValues, currentSheetAnim, heightRef.current);
    resetBackdropHidden(backdropOpacity, currentBackdropAnim);

    runCallback(flags.onOpen);

    const openDriver = buildOpenAnimations(
      sheetValues,
      backdropOpacity,
      currentSheetAnim,
      currentBackdropAnim,
    );

    const finishOpen = () => {
      if (flags.closeAnimationInProgress || !openRef.current) {
        flags.openAnimationInProgress = false;
        return;
      }

      flags.openAnimationInProgress = false;
      flags.openAnimationComplete = true;

      if (flags.pendingHeight != null) {
        const next = flags.pendingHeight;
        const cb = flags.pendingHeightCallback;
        flags.pendingHeight = null;
        flags.pendingHeightCallback = null;
        applyHeightInternal(next, cb);
      }

      runCallback(flags.onOpenComplete);
    };

    if (openDriver) {
      openDriver.start(({finished}) => {
        if (!finished) {
          flags.openAnimationInProgress = false;
          return;
        }
        finishOpen();
      });
    } else {
      finishOpen();
    }
  }, [applyHeightInternal, backdropOpacity, configRef, flags, heightRef, openRef, sheetValues]);

  const finishMeasuring = useCallback((nextHeight) => {
    clearMeasureFallback();
    const maxHeight = configRef.current.maxHeight || Math.floor(HEIGHT * DEFAULT_MAX_HEIGHT_RATIO);
    const clamped = clampHeight(nextHeight, maxHeight);

    resetSheetHidden(sheetValues, resolveSheetAnimation(configRef.current), clamped);
    setHeight(clamped);
    setMeasuring(false);
    setStart(false);

    requestAnimationFrame(() => {
      if (!flags.openAnimationComplete && !flags.openAnimationInProgress && !flags.closeAnimationInProgress) {
        startOpenAnimation();
      }
    });
  }, [clearMeasureFallback, configRef, flags, sheetValues, startOpenAnimation]);

  const setHeightPublic = useCallback((nextHeight, completeEvent) => {
    if (!openRef.current) {
      return;
    }

    const maxHeight = configRef.current.maxHeight || Math.floor(HEIGHT * DEFAULT_MAX_HEIGHT_RATIO);
    const clamped = clampHeight(nextHeight, maxHeight);

    if (measuringRef.current) {
      finishMeasuring(clamped);
      return;
    }

    if (!flags.openAnimationComplete) {
      flags.pendingHeight = clamped;
      if (typeof completeEvent === 'function') {
        flags.pendingHeightCallback = completeEvent;
      }
      return;
    }

    applyHeightInternal(clamped, completeEvent);
  }, [applyHeightInternal, configRef, finishMeasuring, flags, measuringRef, openRef]);

  const show = useCallback((rawConfig = {}) => {
    const defaults = createDefaultConfig();
    const merged = {
      ...defaults,
      ...rawConfig,
      customStyles: {
        ...defaults.customStyles,
        ...(rawConfig.customStyles || {}),
      },
    };

    const autoHeight = merged.autoHeight === true || !(Number(merged.height) > 0);
    const maxHeight = merged.maxHeight || Math.floor(HEIGHT * DEFAULT_MAX_HEIGHT_RATIO);
    const initialHeight = autoHeight
      ? MIN_SHEET_HEIGHT
      : clampHeight(Number(merged.height) || MIN_SHEET_HEIGHT, maxHeight);

    clearMeasureFallback();
    flags.measuredHeight = null;
    flags.openAnimationComplete = false;
    flags.openAnimationInProgress = false;
    flags.closeAnimationInProgress = false;
    flags.pendingHeight = null;
    flags.pendingHeightCallback = null;
    flags.onOpen = merged.onOpen || null;
    flags.onOpenComplete = merged.onOpenComplete || null;
    flags.onClose = merged.onClose || null;
    flags.onCloseComplete = merged.onCloseComplete || null;

    const nextConfig = {
      ...merged,
      autoHeight,
      maxHeight,
      allowHeightShrink: merged.allowHeightShrink !== false,
      closeOnDragDown: merged.closeOnDragDown !== false,
      closeOnPressMask: merged.closeOnPressMask !== false,
      closeOnPressBack: merged.closeOnPressBack !== false,
      dragTopOnly: merged.dragTopOnly === true,
      keyboardHeightAdjustment: merged.keyboardHeightAdjustment === true,
      zIndex: Number.isFinite(merged.zIndex) ? merged.zIndex : LAYER_Z.sheet,
      background: merged.background ?? DEFAULT_DIM,
      maskColor: merged.maskColor ?? null,
      maskOpacity: merged.maskOpacity ?? merged.opacity ?? null,
      mask: merged.mask && typeof merged.mask === 'object' ? merged.mask : null,
      animation: merged.animation || SHEET_ANIMATIONS.slide,
      from: merged.from || SHEET_FROM.bottom,
      backdropAnimation: merged.backdropAnimation ?? BACKDROP_ANIMATIONS.fade,
    };

    const resolvedSheet = resolveSheetAnimation(nextConfig);
    const resolvedBackdrop = resolveBackdropAnimation(nextConfig);
    resetSheetHidden(sheetValues, resolvedSheet, initialHeight);
    resetBackdropHidden(backdropOpacity, resolvedBackdrop);

    // Mark host active BEFORE Modal paints so Popup.show can portal immediately.
    OverlayBus.setHostActive(true);

    setConfig(nextConfig);
    setHeight(initialHeight);
    setKeyboardInset(0);
    setKeyboardGapFill(0);
    setMeasuring(autoHeight);
    setStart(autoHeight);
    setOpen(true);

    if (!autoHeight) {
      requestAnimationFrame(() => startOpenAnimation());
    } else {
      flags.measureFallbackTimer = setTimeout(() => {
        if (!openRef.current || !measuringRef.current || flags.openAnimationComplete) {
          return;
        }
        finishMeasuring(flags.measuredHeight || heightRef.current);
      }, 450);
    }
  }, [
    backdropOpacity,
    clearMeasureFallback,
    finishMeasuring,
    flags,
    heightRef,
    measuringRef,
    openRef,
    sheetValues,
    startOpenAnimation,
  ]);

  useImperativeHandle(ref, () => ({
    show,
    hide: hideInternal,
    hidePopup: hideInternal,
    start: show,
    setHeight: setHeightPublic,
    reportContentHeight: setHeightPublic,
    isOpen: () => openRef.current === true,
    getState: () => ({
      open: openRef.current,
      height: heightRef.current,
      measuring: measuringRef.current,
      ...configRef.current,
    }),
  }), [configRef, heightRef, hideInternal, measuringRef, openRef, setHeightPublic, show]);

  // Back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (openRef.current && configRef.current.closeOnPressBack !== false) {
        hideInternal();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [configRef, hideInternal, openRef]);

  // Keyboard
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event) => {
      if (!configRef.current.keyboardHeightAdjustment || !openRef.current) {
        return;
      }
      const keyboardHeight = event?.endCoordinates?.height || 0;
      const overlap = Platform.OS === 'ios' ? IOS_KEYBOARD_OVERLAP : 0;
      setKeyboardInset(Math.max(0, keyboardHeight - overlap));
      setKeyboardGapFill(overlap);
    };

    const onHide = () => {
      if (!configRef.current.keyboardHeightAdjustment || !openRef.current) {
        return;
      }
      setKeyboardInset(0);
      setKeyboardGapFill(0);
    };

    const s1 = Keyboard.addListener(showEvent, onShow);
    const s2 = Keyboard.addListener(hideEvent, onHide);
    return () => {
      s1.remove();
      s2.remove();
    };
  }, [configRef, openRef]);

  useEffect(() => () => clearMeasureFallback(), [clearMeasureFallback]);

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => configRef.current.closeOnDragDown === true,
      onMoveShouldSetPanResponder: (_e, gesture) =>
        configRef.current.closeOnDragDown === true && gesture.dy > 2,
      onPanResponderMove: (_e, gesture) => {
        // Only drag-to-dismiss downward for bottom sheets; for others allow along primary axis.
        const from = resolveSheetAnimation(configRef.current).from;
        if (from === SHEET_FROM.top) {
          if (gesture.dy < 0) {
            sheetValues.panY.setValue(gesture.dy);
          }
        } else if (from === SHEET_FROM.left) {
          if (gesture.dx < 0) {
            sheetValues.panX.setValue(gesture.dx);
          }
        } else if (from === SHEET_FROM.right) {
          if (gesture.dx > 0) {
            sheetValues.panX.setValue(gesture.dx);
          }
        } else if (gesture.dy > 0) {
          sheetValues.panY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_e, gesture) => {
        const h = heightRef.current;
        const from = resolveSheetAnimation(configRef.current).from;
        let shouldClose = false;

        if (from === SHEET_FROM.top) {
          shouldClose = h / 4 + gesture.dy < 0;
        } else if (from === SHEET_FROM.left) {
          shouldClose = WIDTH / 4 + gesture.dx < 0;
        } else if (from === SHEET_FROM.right) {
          shouldClose = WIDTH / 4 - gesture.dx < 0;
        } else {
          shouldClose = h / 4 - gesture.dy < 0;
        }

        if (shouldClose) {
          hideInternal();
        } else {
          Animated.parallel([
            Animated.spring(sheetValues.panX, {toValue: 0, useNativeDriver: true}),
            Animated.spring(sheetValues.panY, {toValue: 0, useNativeDriver: true}),
          ]).start();
        }
      },
    });
  }, [configRef, heightRef, hideInternal, sheetValues]);

  const sheetLayer = Number.isFinite(config.zIndex) ? config.zIndex : LAYER_Z.sheet;
  const sheetHeightStyle = measuring
    ? null
    : start
      ? {minHeight: MIN_SHEET_HEIGHT}
      : {height};
  const dimColor = resolveMaskColor(config);

  const isEdgeSheet = sheetAnim.from === SHEET_FROM.bottom
    || sheetAnim.from === SHEET_FROM.top
    || sheetAnim.from === SHEET_FROM.left
    || sheetAnim.from === SHEET_FROM.right;

  const hostPositionStyle = useMemo(() => {
    if (measuring) {
      return styles.measureContainer;
    }
    switch (sheetAnim.from) {
      case SHEET_FROM.top:
        return [styles.sheetHostTop, {top: keyboardInset}];
      case SHEET_FROM.left:
        return styles.sheetHostLeft;
      case SHEET_FROM.right:
        return styles.sheetHostRight;
      case SHEET_FROM.center:
        return styles.sheetHostCenter;
      case SHEET_FROM.bottom:
      default:
        return [styles.sheetHostBottom, {bottom: keyboardInset}];
    }
  }, [keyboardInset, measuring, sheetAnim.from]);

  const dragHandlers = !config.dragTopOnly && !measuring ? panResponder.panHandlers : null;
  const handleHandlers = config.dragTopOnly && !measuring ? panResponder.panHandlers : null;
  const BodyComponent = config.component;

  return (
    <View style={styles.modalHost} pointerEvents="box-none">
      <Modal
        visible={open}
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        navigationBarTranslucent
        hardwareAccelerated
        onRequestClose={() => {
          if (config.closeOnPressBack !== false) {
            hideInternal();
          }
        }}
      >
        {/*
          Modal yeni Android window → app SafeAreaProvider inset’leri buraya gelmez.
          React Navigation / RNC docs: Modal içinde ayrı SafeAreaProvider.
        */}
        <SafeAreaProvider
          initialMetrics={initialWindowMetrics}
          style={{flex: 1, width: WIDTH, height: HEIGHT}}
        >
          {/*
            Shared host for sheet dim + PopupPortal.
            Portal must be a sibling ABOVE the sheet layer so alerts cover the drawer.
          */}
          <View
            collapsable={false}
            pointerEvents="box-none"
            style={{width: WIDTH, height: HEIGHT}}
          >
            {/*
              THE DIM IS THIS ROOT PRESSABLE (Fabric-safe — proven in 2.0.0).
              Explicit WIDTH × HEIGHT + static backgroundColor.
              Tap outside sheet → onPress closes (closeOnPressMask).
              Sheet is a nested Pressable so its touches do not bubble to the mask.
            */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sheet"
              disabled={config.closeOnPressMask === false}
              onPress={() => {
                if (config.closeOnPressMask !== false) {
                  hideInternal();
                }
              }}
              collapsable={false}
              style={[
                styles.overlay,
                {
                  width: WIDTH,
                  height: HEIGHT,
                  backgroundColor: dimColor,
                  zIndex: 1,
                },
                config.customStyles?.overlay,
                config.customStyles?.backdrop,
              ]}
            >
              <Pressable
                // Absorb presses on the sheet so the outer mask does not close.
                onPress={() => {}}
                accessible={false}
                pointerEvents="box-none"
                style={[
                  hostPositionStyle,
                  {
                    zIndex: Math.max(2, sheetLayer),
                    elevation: Math.max(12, sheetLayer),
                  },
                ]}
                collapsable={false}
                onLayout={(event) => {
                  const measured = event.nativeEvent.layout.height;

                  if (measuringRef.current) {
                    flags.measuredHeight = measured;
                    return;
                  }

                  if (!start || flags.openAnimationInProgress || flags.openAnimationComplete) {
                    return;
                  }

                  const next = measured < MIN_SHEET_HEIGHT ? MIN_SHEET_HEIGHT : measured;
                  setHeight(clampHeight(next, configRef.current.maxHeight));
                  setStart(false);
                  requestAnimationFrame(() => startOpenAnimation());
                }}
              >
                <SheetFrame
                  sheetAnim={sheetAnim}
                  sheetHeightStyle={sheetHeightStyle}
                  sheetValues={sheetValues}
                  keyboardGapFill={keyboardGapFill}
                  config={config}
                  dragHandlers={dragHandlers}
                  handleHandlers={handleHandlers}
                  isEdgeSheet={isEdgeSheet}
                  BodyComponent={BodyComponent}
                  height={height}
                  keyboardInset={keyboardInset}
                  measuring={measuring}
                  childrenHandleTop={
                    config.closeOnDragDown && isEdgeSheet && sheetAnim.from === SHEET_FROM.bottom ? (
                      <View
                        {...(handleHandlers || {})}
                        style={[styles.draggableContainer, config.customStyles?.draggableContainer]}
                      >
                        <View
                          style={[
                            styles.draggableIcon,
                            config.customStyles?.draggableIcon,
                            config.customStyles?.handle,
                          ]}
                        />
                      </View>
                    ) : null
                  }
                  childrenHandleBottom={
                    config.closeOnDragDown && sheetAnim.from === SHEET_FROM.top ? (
                      <View
                        {...(handleHandlers || {})}
                        style={[
                          styles.draggableContainerBottom,
                          config.customStyles?.draggableContainer,
                        ]}
                      >
                        <View
                          style={[
                            styles.draggableIcon,
                            config.customStyles?.draggableIcon,
                            config.customStyles?.handle,
                          ]}
                        />
                      </View>
                    ) : null
                  }
                />
              </Pressable>
            </Pressable>

            {/* Popup above sheet + sheet dim — own Fabric-safe mask */}
            {open ? <PopupPortal /> : null}
          </View>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
});

/**
 * Thin class host so Root can keep a class ref + static SPSheet.show/hide API.
 * IMPORTANT: never define `get state()` / `get props()` on a React.Component —
 * Fabric assigns `instance.state = memoizedState` and crashes on getter-only props.
 */
class SPSheet extends React.Component {
  static spsheetInstance;
  static SHEET_ANIMATIONS = SHEET_ANIMATIONS;
  static SHEET_FROM = SHEET_FROM;
  static BACKDROP_ANIMATIONS = BACKDROP_ANIMATIONS;
  static LAYER_Z = LAYER_Z;

  constructor(props) {
    super(props);
    this.hostRef = React.createRef();
  }

  componentDidMount() {
    SPSheet.spsheetInstance = this;
  }

  componentWillUnmount() {
    if (SPSheet.spsheetInstance === this) {
      SPSheet.spsheetInstance = null;
    }
  }

  show = (config) => this.hostRef.current?.show(config);
  hide = () => this.hostRef.current?.hide();
  hidePopup = () => this.hostRef.current?.hide();
  start = (config) => this.hostRef.current?.show(config);
  setHeight = (height, completeEvent) => this.hostRef.current?.setHeight(height, completeEvent);
  reportContentHeight = (height, completeEvent) => this.hostRef.current?.setHeight(height, completeEvent);
  isOpen = () => this.hostRef.current?.isOpen?.() === true;
  getState = () => this.hostRef.current?.getState?.() || {open: false};

  static show(config = {}) {
    this.spsheetInstance?.show(config);
  }

  static hide() {
    this.spsheetInstance?.hide();
  }

  static setHeight(height, completeEvent) {
    this.spsheetInstance?.setHeight(height, completeEvent);
  }

  static reportContentHeight(height, completeEvent) {
    this.spsheetInstance?.setHeight(height, completeEvent);
  }

  static isOpen() {
    return this.spsheetInstance?.isOpen?.() === true;
  }

  render() {
    return <SPSheetHost ref={this.hostRef} />;
  }
}

const styles = StyleSheet.create({
  modalHost: {},
  overlay: {
    // width / height / backgroundColor applied inline (Fabric-safe dim)
  },
  sheetHostBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetHostTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  sheetHostLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: Math.min(WIDTH * 0.86, 420),
  },
  sheetHostRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: Math.min(WIDTH * 0.86, 420),
  },
  sheetHostCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  measureContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: HEIGHT,
  },
  container: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  containerTop: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  containerSide: {
    borderRadius: 0,
    height: '100%',
    minHeight: HEIGHT,
  },
  containerCenter: {
    borderRadius: 20,
    maxWidth: 420,
    width: '100%',
  },
  draggableContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingBottom: 4,
  },
  draggableContainerBottom: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 4,
    paddingBottom: 8,
  },
  draggableIcon: {
    height: 5,
    borderRadius: 999,
    width: 44,
    backgroundColor: '#D1D5DB',
  },
  keyboardGapFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
  },
});

export {LAYER_Z, SHEET_ANIMATIONS, SHEET_FROM, BACKDROP_ANIMATIONS};
export default SPSheet;
