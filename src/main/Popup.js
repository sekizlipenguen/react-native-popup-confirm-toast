import React, {Component} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PRIMARY = '#D6001F';
const PRIMARY_PRESSED = '#B8001A';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const BORDER = '#E5E5E5';
const SURFACE = '#FFFFFF';
const DEFAULT_DIM = 'rgba(0, 0, 0, 0.5)';

class Popup extends Component {
  static popupInstance;

  constructor(props) {
    super(props);

    this.height = Platform.OS === 'android' ? Dimensions.get('screen').height : Dimensions.get('window').height;
    this.width = Platform.OS === 'android' ? Dimensions.get('screen').width : Dimensions.get('window').width;

    // Only the card slides. Dim is a static backgroundColor (Fabric-safe).
    this.positionPopup = new Animated.Value(this.height);

    this.defaultState = {
      popupHeight: 0,
      title: false,
      type: 'warning',
      buttonEnabled: true,
      textBody: false,
      bodyComponent: false,
      bodyComponentForce: false,
      buttonText: 'Ok',
      confirmText: 'Cancel',
      callback: () => this.hidePopup(),
      cancelCallback: () => this.hidePopup(),
      background: DEFAULT_DIM,
      timing: 0,
      iconEnabled: true,
      icon: false,
      iconHeaderStyle: false,
      containerStyle: false,
      modalContainerStyle: false,
      buttonContentStyle: false,
      okButtonStyle: false,
      confirmButtonStyle: false,
      okButtonTextStyle: false,
      confirmButtonTextStyle: false,
      titleTextStyle: false,
      descTextStyle: false,
      start: false,
      useNativeDriver: true,
      bounciness: 12,
      onClose: false,
      onCloseComplete: false,
      onOpenComplete: false,
      onOpen: false,
      duration: 180,
      closeDuration: 160,
      show: false,
      open: false,
    };

    this.state = {...this.defaultState};
    this.openAnimationInProgress = false;
    this.closeAnimationInProgress = false;
    this.measureFallbackTimer = null;
    this.autoHideTimer = null;

    this.updateDimensions = this.updateDimensions.bind(this);
  }

  static show({...config}) {
    this.popupInstance.start(config);
  }

  static hide() {
    this.popupInstance.hidePopup();
  }

  componentDidMount() {
    this.dimensionsSubscription = Dimensions.addEventListener('change', this.updateDimensions);
  }

  componentWillUnmount() {
    this.dimensionsSubscription?.remove?.();
    this.clearTimers();
  }

  clearTimers() {
    if (this.measureFallbackTimer) {
      clearTimeout(this.measureFallbackTimer);
      this.measureFallbackTimer = null;
    }
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  start({...config}) {
    const type = config.type || 'warning';
    const nextConfig = {...config};

    if (nextConfig.confirmText == null && nextConfig.cancelButtonText != null) {
      nextConfig.confirmText = nextConfig.cancelButtonText;
    }

    if (type === 'confirm' && nextConfig.iconEnabled === undefined) {
      nextConfig.iconEnabled = false;
    }

    this.clearTimers();
    this.closeAnimationInProgress = false;
    this.openAnimationInProgress = false;
    this.positionPopup.setValue(this.height);

    this.setState({
      ...this.defaultState,
      ...nextConfig,
      type,
      start: true,
      show: false,
      open: true,
      popupHeight: 0,
    }, () => {
      // If onLayout is delayed inside Modal, still open with a fallback height.
      this.measureFallbackTimer = setTimeout(() => {
        if (this.state.open && this.state.start && !this.state.show && !this.openAnimationInProgress) {
          const fallbackHeight = this.state.popupHeight > 0 ? this.state.popupHeight : 220;
          this.setState({popupHeight: fallbackHeight}, () => this.startPopup());
        }
      }, 80);
    });
  }

  startPopup() {
    if (this.state.show || !this.state.start || this.openAnimationInProgress || this.closeAnimationInProgress) {
      return;
    }

    this.openAnimationInProgress = true;
    this.clearTimers();

    if (typeof this.state.onOpen === 'function') {
      this.state.onOpen();
    }

    const targetY = Math.max(40, (this.height / 2) - (this.state.popupHeight / 2));

    // Keep open=true for the whole animation so Modal stays mounted.
    this.setState({start: false}, () => {
      this.positionPopup.setValue(this.height);

      Animated.spring(this.positionPopup, {
        toValue: targetY,
        bounciness: this.state.bounciness,
        speed: 14,
        useNativeDriver: true,
      }).start(({finished}) => {
        this.openAnimationInProgress = false;
        if (!finished || !this.state.open) {
          return;
        }

        this.setState({show: true}, () => {
          if (typeof this.state.onOpenComplete === 'function') {
            this.state.onOpenComplete();
          }
        });
      });

      if (this.state.timing !== 0) {
        const duration = this.state.timing > 0 ? this.state.timing : 5000;
        this.autoHideTimer = setTimeout(() => this.hidePopup(), duration);
      }
    });
  }

  hidePopup() {
    const {onCloseComplete, onClose, open} = this.state;
    if (!open || this.closeAnimationInProgress) {
      return;
    }

    this.closeAnimationInProgress = true;
    this.openAnimationInProgress = false;
    this.clearTimers();

    if (typeof onClose === 'function') {
      onClose();
    }

    this.positionPopup.stopAnimation();

    Animated.timing(this.positionPopup, {
      toValue: this.height,
      duration: this.state.closeDuration,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      this.closeAnimationInProgress = false;
      this.positionPopup.setValue(this.height);
      this.setState({...this.defaultState}, () => {
        if (typeof onCloseComplete === 'function') {
          onCloseComplete();
        }
      });
    });
  }

  handleImage(type) {
    switch (type) {
      case 'success':
        return this.state.icon || require('../assets/success.png');
      case 'danger':
        return this.state.icon || require('../assets/error.png');
      case 'warning':
        return this.state.icon || require('../assets/warning.png');
      case 'confirm':
        return this.state.icon || require('../assets/warning.png');
      default:
        return this.state.icon || require('../assets/warning.png');
    }
  }

  updateDimensions = () => {
    setTimeout(() => {
      const {height, width} = Platform.OS === 'android'
        ? Dimensions.get('screen')
        : Dimensions.get('window');

      this.height = height;
      this.width = width;
      this.setState({});
    }, 100);
  };

  renderConfirmButtons(callback, cancelCallback, buttonText, confirmText) {
    return (
      <View style={[styles.buttonRow, this.state.buttonContentStyle]}>
        <Pressable
          style={({pressed}) => [
            styles.Button,
            styles.cancelOutline,
            this.state.confirmButtonStyle,
            pressed && styles.cancelOutlinePressed,
          ]}
          android_ripple={{color: 'rgba(17, 17, 17, 0.08)'}}
          onPress={() => {
            if (typeof cancelCallback === 'function') {
              cancelCallback();
            } else {
              this.hidePopup();
            }
          }}
        >
          <Text style={[styles.cancelText, this.state.confirmButtonTextStyle]} numberOfLines={1}>
            {confirmText}
          </Text>
        </Pressable>

        <Pressable
          style={({pressed}) => [
            styles.Button,
            styles.primaryButton,
            this.state.okButtonStyle,
            pressed && styles.primaryButtonPressed,
          ]}
          android_ripple={{color: 'rgba(255, 255, 255, 0.2)'}}
          onPress={() => {
            if (typeof callback === 'function') {
              callback();
            }
          }}
        >
          <Text style={[styles.primaryText, this.state.okButtonTextStyle]} numberOfLines={1}>
            {buttonText}
          </Text>
        </Pressable>
      </View>
    );
  }

  render() {
    const {
      title,
      type,
      textBody,
      buttonEnabled,
      buttonText,
      confirmText,
      callback,
      cancelCallback,
      background,
      iconEnabled,
      iconHeaderStyle,
      start,
      show,
      open,
      bodyComponent,
      containerStyle,
      modalContainerStyle,
      bodyComponentForce,
    } = this.state;

    const typeName = type + 'ButtonStyle';
    const BodyComponentElement = bodyComponent ? bodyComponent : false;
    const isConfirm = type === 'confirm';
    const dimColor = background && background !== 'transparent' ? background : DEFAULT_DIM;

    return (
      <View style={styles.modalHost} pointerEvents="box-none">
        <Modal
          visible={open === true}
          transparent
          animationType="none"
          presentationStyle="overFullScreen"
          statusBarTranslucent
          hardwareAccelerated
          onRequestClose={() => this.hidePopup()}
        >
          {/*
            Static dim (no Animated opacity) — same Fabric-safe pattern as SPSheet.
            Nested Modal stacks above SPSheet so alerts from sheets are visible.
          */}
          <View
            collapsable={false}
            pointerEvents={show || start ? 'auto' : 'box-none'}
            style={[
              styles.Container,
              {
                width: this.width,
                height: this.height,
                backgroundColor: dimColor,
              },
              containerStyle,
            ]}
          >
            <Animated.View
              onLayout={event => {
                if (!start || bodyComponentForce || this.openAnimationInProgress || show) {
                  return;
                }
                const height = event.nativeEvent.layout.height;
                if (!height) {
                  return;
                }
                this.setState({popupHeight: height}, () => this.startPopup());
              }}
              style={[
                styles.Message,
                this.state.popupHeight > 0 ? {minHeight: this.state.popupHeight} : null,
                modalContainerStyle,
                {transform: [{translateY: this.positionPopup}]},
              ]}
              pointerEvents={show || start ? 'auto' : 'box-none'}
            >
              {bodyComponentForce ? (
                BodyComponentElement ? (
                  <BodyComponentElement
                    {...this.props}
                    onLayout={event => {
                      if (!event || !start || this.state.show || this.openAnimationInProgress) {
                        return;
                      }
                      const height = event.nativeEvent.layout.height;
                      if (!height) {
                        return;
                      }
                      this.setState({popupHeight: height}, () => this.startPopup());
                    }}
                  />
                ) : null
              ) : (
                <>
                  {iconEnabled ? (
                    <>
                      <View style={[styles.Header, iconHeaderStyle]} />
                      <Image
                        source={this.handleImage(type)}
                        resizeMode="contain"
                        style={styles.Image}
                      />
                    </>
                  ) : null}
                  <View style={[styles.Content, !iconEnabled && styles.contentCompact]}>
                    {title && title.length > 0 ? (
                      <Text style={[styles.Title, this.state.titleTextStyle]}>{title}</Text>
                    ) : null}
                    {textBody ? (
                      <Text style={[styles.Desc, this.state.descTextStyle]}>{textBody}</Text>
                    ) : null}
                    {BodyComponentElement ? <BodyComponentElement {...this.props} /> : null}
                    {isConfirm ? (
                      this.renderConfirmButtons(callback, cancelCallback, buttonText, confirmText)
                    ) : (
                      <View style={[styles.buttonRow, styles.buttonRowSingle, this.state.buttonContentStyle]}>
                        {buttonEnabled ? (
                          <TouchableOpacity
                            style={[styles.Button, styles[typeName], styles.primaryButton, this.state.okButtonStyle]}
                            activeOpacity={0.85}
                            onPress={() => {
                              if (typeof callback === 'function') {
                                callback();
                              }
                            }}
                          >
                            <Text style={[styles.primaryText, this.state.okButtonTextStyle]}>{buttonText}</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    )}
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modalHost: {},
  Container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  Message: {
    width: '88%',
    maxWidth: 360,
    backgroundColor: SURFACE,
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'absolute',
    left: '6%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  Content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    width: '100%',
  },
  contentCompact: {
    paddingTop: 24,
  },
  Header: {
    height: 72,
    width: 100,
    backgroundColor: SURFACE,
  },
  Image: {
    width: 44,
    height: 44,
    position: 'absolute',
    top: 20,
  },
  Title: {
    color: TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },
  Desc: {
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
  Button: {
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
  primaryButtonPressed: {
    backgroundColor: PRIMARY_PRESSED,
    opacity: 0.92,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelOutline: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cancelOutlinePressed: {
    backgroundColor: '#F0F0F0',
    borderColor: '#D0D0D0',
    opacity: 0.82,
  },
  cancelText: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  successButtonStyle: {
    backgroundColor: PRIMARY,
  },
  dangerButtonStyle: {
    backgroundColor: PRIMARY,
  },
  warningButtonStyle: {
    backgroundColor: PRIMARY,
  },
  confirmButtonStyle: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
});

export default Popup;
