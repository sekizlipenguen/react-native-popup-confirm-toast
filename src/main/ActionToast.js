import React, {Component} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const DEFAULT_DURATION = 4000;
const HIDDEN_OFFSET = 120;

class ActionToast extends Component {
  static actionToastInstance;

  constructor(props) {
    super(props);

    this.hideTimer = null;
    this.translateY = new Animated.Value(HIDDEN_OFFSET);
    this.opacity = new Animated.Value(0);

    this.state = {
      visible: false,
      rendered: false,
      message: '',
      duration: DEFAULT_DURATION,
      bottomOffset: 16,
      action: null,
      onClose: null,
      stylesConfig: {},
    };
  }

  static show(config = {}) {
    this.actionToastInstance.present(config);
  }

  static hide() {
    this.actionToastInstance.dismiss();
  }

  clearHideTimer() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  scheduleHide(duration) {
    this.clearHideTimer();
    this.hideTimer = setTimeout(() => {
      this.dismiss();
    }, duration);
  }

  present(config = {}) {
    this.clearHideTimer();

    this.setState({
      visible: true,
      rendered: true,
      message: config.message || config.text || '',
      duration: config.duration || DEFAULT_DURATION,
      bottomOffset: config.bottomOffset ?? 16,
      action: config.action || null,
      onClose: config.onClose || null,
      stylesConfig: config.styles || {},
    }, () => {
      Animated.parallel([
        Animated.spring(this.translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }),
        Animated.timing(this.opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      this.scheduleHide(config.duration || DEFAULT_DURATION);
    });
  }

  dismiss() {
    this.clearHideTimer();

    if (!this.state.rendered) {
      return;
    }

    this.setState({visible: false});

    Animated.parallel([
      Animated.timing(this.translateY, {
        toValue: HIDDEN_OFFSET,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(this.opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(({finished}) => {
      if (!finished) {
        return;
      }

      const onClose = this.state.onClose;
      this.setState({
        rendered: false,
        message: '',
        action: null,
        onClose: null,
      });
      onClose?.();
    });
  }

  onActionPress = () => {
    const onPress = this.state.action?.onPress;
    this.dismiss();
    onPress?.();
  };

  render() {
    const {rendered, visible, message, bottomOffset, action, stylesConfig} = this.state;

    if (!rendered) {
      return null;
    }

    const {
      wrap,
      bar,
      actionButton,
      message: messageStyle,
      closeButton,
    } = stylesConfig;

    return (
      <View pointerEvents="box-none" style={styles.host}>
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={[
            styles.wrap,
            wrap,
            {
              bottom: bottomOffset,
              opacity: this.opacity,
              transform: [{translateY: this.translateY}],
            },
          ]}
        >
          <Pressable style={[styles.bar, bar]} onPress={action?.onPress ? this.onActionPress : undefined}>
            {action?.node ? (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  actionButton,
                  action.backgroundColor ? {backgroundColor: action.backgroundColor} : null,
                ]}
                onPress={this.onActionPress}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={action.accessibilityLabel || 'Action'}
              >
                {action.node}
              </TouchableOpacity>
            ) : null}

            <Text style={[styles.message, messageStyle]} numberOfLines={2}>
              {message}
            </Text>

            <TouchableOpacity
              style={[styles.closeBtn, closeButton]}
              onPress={() => this.dismiss()}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              accessibilityRole="button"
              accessibilityLabel={action?.closeAccessibilityLabel || 'Close'}
            >
              {action?.closeNode || <Text style={styles.closeGlyph}>×</Text>}
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100000,
    elevation: 16,
  },
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    borderWidth: Platform.OS === 'android' ? 0 : 1,
    borderColor: '#EFEFEF',
    elevation: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D6001F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    lineHeight: 20,
    paddingRight: 8,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontSize: 22,
    lineHeight: 24,
    color: '#666',
    fontWeight: '500',
  },
});

export default ActionToast;
