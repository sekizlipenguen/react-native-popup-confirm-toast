import React, {Component} from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

const ANDROID_API_LEVEL = Platform.Version;

const HEIGHT =
  Platform.OS === 'android'
    ? ANDROID_API_LEVEL >= 29
      ? Dimensions.get('window').height
      : Dimensions.get('screen').height
    : Dimensions.get('window').height;

const WIDTH = Platform.OS === 'android' ? Dimensions.get('screen').width : Dimensions.get('window').width;

const MIN_SHEET_HEIGHT = 100;
const IOS_KEYBOARD_OVERLAP = 12;
const DEFAULT_MAX_HEIGHT_RATIO = 0.92;
const DEFAULT_DIM = 'rgba(0, 0, 0, 0.5)';

function createBaseState() {
  return {
    height: MIN_SHEET_HEIGHT,
    start: false,
    customStyles: {
      draggableIcon: {},
      container: {},
      draggableContainer: {},
    },
    background: DEFAULT_DIM,
    duration: 250,
    closeDuration: 300,
    closeOnDragDown: true,
    closeOnPressMask: true,
    closeOnPressBack: true,
    dragTopOnly: false,
    component: null,
    open: false,
    keyboardHeightAdjustment: false,
    keyboardGapFill: 0,
    autoHeight: false,
    allowHeightShrink: true,
    measuring: false,
    maxHeight: Math.floor(HEIGHT * DEFAULT_MAX_HEIGHT_RATIO),
  };
}

function runCallback(callback, payload) {
  if (typeof callback === 'function') {
    callback(payload);
  }
}

/**
 * SPSheet — bottom sheet overlay.
 *
 * Dim strategy (critical on Fabric / New Architecture):
 * Put `backgroundColor` on the Modal's root View with EXPLICIT width/height.
 * Do NOT rely on Animated opacity or absoluteFill-only children for the dim —
 * those often end up 0×0 inside RN Modal under Reanimated's commit hook.
 * Sheet is a sibling with its own opaque background (never a child of a fading dim).
 */
class SPSheet extends Component {
  static spsheetInstance;

  constructor(props) {
    super(props);

    this.pan = new Animated.ValueXY();
    this.sheetTranslateY = new Animated.Value(HEIGHT);
    this.marginBottom = new Animated.Value(0);

    this.openAnimationComplete = false;
    this.openAnimationInProgress = false;
    this.closeAnimationInProgress = false;
    this.pendingHeight = null;
    this.pendingHeightCallback = null;
    this.onOpenCallback = null;
    this.onOpenCompleteCallback = null;
    this.onCloseCallback = null;
    this.onCloseCompleteCallback = null;
    this.keyboardInset = 0;
    this.measureFallbackTimer = null;

    this.state = createBaseState();
    this.panResponder = this.createPanResponder();

    this.keyboardDidShow = this.keyboardDidShow.bind(this);
    this.keyboardDidHide = this.keyboardDidHide.bind(this);
    this.handleBackButton = this.handleBackButton.bind(this);
  }

  static show(config = {}) {
    this.spsheetInstance.start(config);
  }

  static hide() {
    this.spsheetInstance.hidePopup();
  }

  static setHeight(height, completeEvent) {
    this.spsheetInstance.setHeight(height, completeEvent);
  }

  static reportContentHeight(height, completeEvent) {
    this.spsheetInstance.setHeight(height, completeEvent);
  }

  componentDidMount() {
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);

    if (Platform.OS === 'ios') {
      this.keyboardShowSubscription = Keyboard.addListener('keyboardWillShow', this.keyboardDidShow);
      this.keyboardHideSubscription = Keyboard.addListener('keyboardWillHide', this.keyboardDidHide);
    } else {
      this.keyboardShowSubscription = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
      this.keyboardHideSubscription = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
    }
  }

  componentWillUnmount() {
    this.backHandler?.remove?.();
    this.keyboardShowSubscription?.remove?.();
    this.keyboardHideSubscription?.remove?.();
    this.clearMeasureFallback();
  }

  clampHeight(height) {
    const maxHeight = this.state.maxHeight || Math.floor(HEIGHT * DEFAULT_MAX_HEIGHT_RATIO);
    return Math.min(Math.max(height, MIN_SHEET_HEIGHT), maxHeight);
  }

  getHiddenTranslateY(height = this.state.height) {
    return Math.max(height, MIN_SHEET_HEIGHT);
  }

  clearMeasureFallback() {
    if (this.measureFallbackTimer) {
      clearTimeout(this.measureFallbackTimer);
      this.measureFallbackTimer = null;
    }
  }

  scheduleMeasureFallback() {
    this.clearMeasureFallback();
    this.measureFallbackTimer = setTimeout(() => {
      if (!this.state.open || !this.state.measuring || this.openAnimationComplete) {
        return;
      }

      const fallbackHeight = this.measuredHeight || this.state.height;
      this.finishMeasuring(fallbackHeight);
    }, 450);
  }

  finishMeasuring(nextHeight) {
    this.clearMeasureFallback();
    const clampedHeight = this.clampHeight(nextHeight);

    this.sheetTranslateY.setValue(this.getHiddenTranslateY(clampedHeight));

    this.setState({
      height: clampedHeight,
      measuring: false,
      start: false,
    }, () => {
      if (!this.openAnimationComplete && !this.openAnimationInProgress && !this.closeAnimationInProgress) {
        requestAnimationFrame(() => {
          this.startPopup();
        });
      }
    });
  }

  keyboardDidShow(event) {
    if (!this.state.keyboardHeightAdjustment || !this.state.open) {
      return;
    }

    const keyboardHeight = event?.endCoordinates?.height || 0;
    const overlap = Platform.OS === 'ios' ? IOS_KEYBOARD_OVERLAP : 0;
    this.keyboardInset = Math.max(0, keyboardHeight - overlap);
    this.setState({keyboardGapFill: overlap});
  }

  keyboardDidHide() {
    if (!this.state.keyboardHeightAdjustment || !this.state.open) {
      return;
    }

    this.keyboardInset = 0;
    this.setState({keyboardGapFill: 0});
  }

  handleBackButton() {
    if (this.state.open && this.state.closeOnPressBack) {
      this.hidePopup();
      return true;
    }
    return false;
  }

  start(config = {}) {
    const autoHeight = config.autoHeight === true || !(Number(config.height) > 0);
    const maxHeight = config.maxHeight || Math.floor(HEIGHT * DEFAULT_MAX_HEIGHT_RATIO);
    const initialHeight = autoHeight
      ? MIN_SHEET_HEIGHT
      : this.clampHeight(Number(config.height) || MIN_SHEET_HEIGHT);

    this.clearMeasureFallback();
    this.measuredHeight = null;
    this.openAnimationComplete = false;
    this.openAnimationInProgress = false;
    this.closeAnimationInProgress = false;
    this.pendingHeight = null;
    this.pendingHeightCallback = null;
    this.onOpenCallback = config.onOpen || null;
    this.onOpenCompleteCallback = config.onOpenComplete || null;
    this.onCloseCallback = config.onClose || null;
    this.onCloseCompleteCallback = config.onCloseComplete || null;

    this.pan.setValue({x: 0, y: 0});
    this.marginBottom.setValue(0);
    this.keyboardInset = 0;
    this.sheetTranslateY.setValue(this.getHiddenTranslateY(initialHeight));

    this.setState({
      ...createBaseState(),
      open: true,
      start: autoHeight,
      autoHeight,
      maxHeight,
      allowHeightShrink: config.allowHeightShrink !== false,
      component: config.component || null,
      background: config.background ?? DEFAULT_DIM,
      duration: config.duration ?? 250,
      closeDuration: config.closeDuration ?? 300,
      closeOnDragDown: config.closeOnDragDown !== false,
      closeOnPressMask: config.closeOnPressMask !== false,
      closeOnPressBack: config.closeOnPressBack !== false,
      dragTopOnly: config.dragTopOnly === true,
      keyboardHeightAdjustment: config.keyboardHeightAdjustment === true,
      customStyles: {
        draggableIcon: {},
        container: {},
        draggableContainer: {},
        ...(config.customStyles || {}),
      },
      height: initialHeight,
      measuring: autoHeight,
    }, () => {
      if (!autoHeight) {
        requestAnimationFrame(() => {
          this.startPopup();
        });
      } else {
        this.scheduleMeasureFallback();
      }
    });
  }

  startPopup() {
    if (this.openAnimationInProgress || this.openAnimationComplete || this.closeAnimationInProgress) {
      return;
    }

    this.openAnimationInProgress = true;
    const {height, duration} = this.state;

    this.setState({start: false}, () => {
      if (this.closeAnimationInProgress || !this.state.open) {
        this.openAnimationInProgress = false;
        return;
      }

      runCallback(this.onOpenCallback, this.props);
      this.sheetTranslateY.setValue(this.getHiddenTranslateY(height));

      Animated.timing(this.sheetTranslateY, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({finished}) => {
        if (!finished || this.closeAnimationInProgress || !this.state.open) {
          this.openAnimationInProgress = false;
          return;
        }

        this.openAnimationInProgress = false;
        this.openAnimationComplete = true;

        if (this.pendingHeight != null) {
          const nextHeight = this.pendingHeight;
          const callback = this.pendingHeightCallback;
          this.pendingHeight = null;
          this.pendingHeightCallback = null;
          this.applyHeight(nextHeight, callback);
        }

        runCallback(this.onOpenCompleteCallback, this.props);
      });
    });
  }

  hidePopup() {
    const {closeDuration, open, height} = this.state;

    if (!open || this.closeAnimationInProgress) {
      return;
    }

    this.closeAnimationInProgress = true;
    this.openAnimationInProgress = false;
    const onCloseCompleteCallback = this.onCloseCompleteCallback;
    runCallback(this.onCloseCallback, this.props);

    this.sheetTranslateY.stopAnimation();
    this.pan.stopAnimation();

    Animated.timing(this.sheetTranslateY, {
      toValue: this.getHiddenTranslateY(height),
      duration: closeDuration,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      this.openAnimationComplete = false;
      this.openAnimationInProgress = false;
      this.closeAnimationInProgress = false;
      this.pendingHeight = null;
      this.pendingHeightCallback = null;
      this.clearMeasureFallback();
      this.pan.setValue({x: 0, y: 0});
      this.marginBottom.setValue(0);
      this.keyboardInset = 0;
      this.onOpenCallback = null;
      this.onOpenCompleteCallback = null;
      this.onCloseCallback = null;
      this.onCloseCompleteCallback = null;

      this.setState({
        ...createBaseState(),
        height: 0,
      }, () => {
        runCallback(onCloseCompleteCallback, this.props);
      });
    });
  }

  setHeight(height, completeEvent) {
    if (!this.state.open) {
      return;
    }

    const nextHeight = this.clampHeight(height);

    if (this.state.measuring) {
      this.finishMeasuring(nextHeight);
      return;
    }

    if (!this.openAnimationComplete) {
      this.pendingHeight = nextHeight;
      if (typeof completeEvent === 'function') {
        this.pendingHeightCallback = completeEvent;
      }
      return;
    }

    this.applyHeight(nextHeight, completeEvent);
  }

  applyHeight(height, completeEvent) {
    const nextHeight = this.clampHeight(height);
    const {allowHeightShrink} = this.state;
    const currentHeight = this.state.height;

    if (!allowHeightShrink && nextHeight < currentHeight) {
      runCallback(completeEvent, this.props);
      return;
    }

    if (Math.abs(nextHeight - currentHeight) < 2) {
      runCallback(completeEvent, this.props);
      return;
    }

    this.setState({height: nextHeight, start: false}, () => {
      runCallback(completeEvent, this.props);
    });
  }

  createPanResponder() {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => this.state.closeOnDragDown,
      onMoveShouldSetPanResponder: (_event, gestureState) =>
        this.state.closeOnDragDown && gestureState.dy > 2,
      onPanResponderMove: (_event, gestureState) => {
        if (gestureState.dy > 0) {
          this.pan.setValue({x: 0, y: gestureState.dy});
        }
      },
      onPanResponderRelease: (_event, gestureState) => {
        const {height} = this.state;
        if (height / 4 - gestureState.dy < 0) {
          this.hidePopup();
        } else {
          Animated.spring(this.pan, {
            toValue: {x: 0, y: 0},
            useNativeDriver: true,
          }).start();
        }
      },
    });
  }

  render() {
    const {
      open,
      closeOnDragDown,
      dragTopOnly,
      closeOnPressMask,
      closeOnPressBack,
      component: BodyComponent,
      customStyles,
      height,
      start,
      background,
      keyboardGapFill,
      measuring,
    } = this.state;

    const panResponder = this.panResponder;
    const sheetHeightStyle = measuring
      ? null
      : start
        ? {minHeight: MIN_SHEET_HEIGHT}
        : {height};
    const dimColor = background && background !== 'transparent' ? background : DEFAULT_DIM;

    // New Architecture: wrap Modal in a host View (known RN Modal + Reanimated fix).
    return (
      <View style={styles.modalHost} pointerEvents="box-none">
        <Modal
          visible={open}
          transparent
          animationType="none"
          presentationStyle="overFullScreen"
          statusBarTranslucent
          hardwareAccelerated
          onRequestClose={() => {
            if (closeOnPressBack) {
              this.hidePopup();
            }
          }}
        >
          {/*
            THE DIM IS THIS ROOT VIEW.
            Explicit WIDTH × HEIGHT + backgroundColor — same idea as the original
            SPSheet modalContainer. Never animate this opacity.
          */}
          <View
            collapsable={false}
            style={[
              styles.overlay,
              {
                width: WIDTH,
                height: HEIGHT,
                backgroundColor: dimColor,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sheet"
              disabled={!closeOnPressMask}
              onPress={() => {
                if (closeOnPressMask) {
                  this.hidePopup();
                }
              }}
              style={styles.pressMask}
            />

            <View
              pointerEvents="box-none"
              style={[
                measuring ? styles.measureContainer : styles.sheetHost,
                !measuring ? {bottom: this.keyboardInset} : null,
              ]}
              collapsable={false}
              onLayout={event => {
                const measuredHeight = event.nativeEvent.layout.height;

                if (this.state.measuring) {
                  this.measuredHeight = measuredHeight;
                  return;
                }

                if (!start || this.openAnimationInProgress || this.openAnimationComplete) {
                  return;
                }

                const nextHeight = measuredHeight < MIN_SHEET_HEIGHT ? MIN_SHEET_HEIGHT : measuredHeight;

                this.setState({height: this.clampHeight(nextHeight), start: false}, () => {
                  requestAnimationFrame(() => {
                    this.startPopup();
                  });
                });
              }}
            >
              <Animated.View
                {...(!dragTopOnly && !measuring && panResponder?.panHandlers)}
                style={[
                  styles.container,
                  sheetHeightStyle,
                  {
                    transform: [
                      {translateX: this.pan.x},
                      {translateY: Animated.add(this.sheetTranslateY, this.pan.y)},
                    ],
                    overflow: keyboardGapFill > 0 ? 'visible' : 'hidden',
                  },
                  customStyles.container,
                ]}
              >
                {closeOnDragDown ? (
                  <View
                    {...(dragTopOnly && !measuring && panResponder?.panHandlers)}
                    style={[styles.draggableContainer, customStyles.draggableContainer]}
                  >
                    <View style={[styles.draggableIcon, customStyles.draggableIcon]} />
                  </View>
                ) : null}

                {BodyComponent ? (
                  <BodyComponent
                    {...this.props}
                    sheetProps={{
                      sheetHeight: height,
                      keyboardInset: this.keyboardInset,
                      measuring,
                    }}
                  />
                ) : null}

                {Platform.OS === 'ios' && keyboardGapFill > 0 ? (
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
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modalHost: {
    // Host wrapper only — Modal portals to its own window.
    // Known New Architecture + Reanimated workaround: never mount Modal as a bare root child.
  },
  overlay: {
    // width / height / backgroundColor applied inline
  },
  pressMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    elevation: 10,
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
  measureContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: HEIGHT,
  },
  draggableContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingBottom: 4,
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

export default SPSheet;
