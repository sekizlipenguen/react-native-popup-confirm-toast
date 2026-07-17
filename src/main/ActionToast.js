import React, {Component} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {FullWindowOverlay} from 'react-native-screens';

import {getStatusBarHeight} from './Helper';
import {
  animationFromForPosition,
  DEFAULT_DURATION,
  DEFAULT_MAX_VISIBLE,
  DEFAULT_OFFSET,
  positionFromKey,
  STACK_GAP,
  TOAST_ANIMATIONS,
  TOAST_MODES,
  TOAST_POSITIONS,
  TYPE_PRESETS,
} from './toast/constants';
import {createToastQueue, nextToastId} from './toast/ToastQueue';
import {
  getActionToastHost,
  registerActionToastHost,
  unregisterActionToastHost,
} from './toast/ActionToastHost';

const HIDDEN = 56;
const ENTER_DURATION = 220;
const EXIT_DURATION = 160;

function windowSize() {
  // Android Fabric: absoluteFill-only host 0×0 olabiliyor; açık boyut + screen daha güvenli.
  // iOS FullWindowOverlay: window yeterli.
  const dims = Dimensions.get(Platform.OS === 'android' ? 'screen' : 'window');
  return {width: dims.width, height: dims.height};
}

function resolveColors(config) {
  const preset = (config.type && TYPE_PRESETS[config.type]) || null;
  const hasActionLegacy = !!(config.action && !config.type && !config.backgroundColor);

  if (hasActionLegacy) {
    return {
      backgroundColor: '#FFFFFF',
      textColor: '#111111',
      iconColor: '#111111',
      legacyCart: true,
    };
  }

  return {
    backgroundColor: config.backgroundColor || preset?.backgroundColor || '#333333',
    textColor: config.textColor || preset?.textColor || '#FFFFFF',
    iconColor: config.iconColor || preset?.iconColor || '#FFFFFF',
    legacyCart: false,
    iconGlyph: preset?.iconGlyph,
  };
}

function normalizeConfig(config = {}, defaults = {}) {
  const merged = {...defaults, ...config};
  const id = merged.id != null ? String(merged.id) : nextToastId();
  const colors = resolveColors(merged);
  const duration =
    merged.duration === 0 || merged.duration === false
      ? 0
      : (merged.duration ?? DEFAULT_DURATION);

  let icon = merged.icon;
  if (icon === undefined && colors.iconGlyph && !colors.legacyCart) {
    icon = merged.type === 'loading' ? 'loading' : colors.iconGlyph;
  }

  const mode = merged.mode || TOAST_MODES.stack;
  const maxVisible =
    mode === TOAST_MODES.queue
      ? 1
      : (merged.maxVisible ?? defaults.maxVisible ?? DEFAULT_MAX_VISIBLE);

  // Position offset: top* için status bar altına yer; bottom* için bottomOffset
  const {isTop, isBottom} = positionFromKey(merged.position || TOAST_POSITIONS.bottom);
  let edgeInset = DEFAULT_OFFSET;
  if (isBottom) {
    edgeInset = merged.bottomOffset ?? merged.offset ?? DEFAULT_OFFSET;
  } else if (isTop) {
    edgeInset = merged.offset ?? (merged.bottomOffset < 40 ? merged.bottomOffset : DEFAULT_OFFSET) ?? DEFAULT_OFFSET;
  } else {
    edgeInset = merged.offset ?? DEFAULT_OFFSET;
  }

  return {
    id,
    title: merged.title || '',
    message: merged.message || merged.text || '',
    type: merged.type,
    icon,
    backgroundColor: colors.backgroundColor,
    textColor: colors.textColor,
    iconColor: colors.iconColor,
    legacyCart: colors.legacyCart,
    duration,
    position: merged.position || TOAST_POSITIONS.bottom,
    animation: merged.animation || TOAST_ANIMATIONS.spring,
    mode,
    maxVisible,
    offset: edgeInset,
    bottomOffset: edgeInset,
    onPress: typeof merged.onPress === 'function' ? merged.onPress : null,
    pressDismiss:
      typeof merged.pressDismiss === 'boolean'
        ? merged.pressDismiss
        : !!merged.onPress,
    action: merged.action || null,
    closeable: typeof merged.closeable === 'boolean' ? merged.closeable : true,
    messageNumberOfLines:
      merged.messageNumberOfLines === false || merged.messageNumberOfLines === 0
        ? 0
        : typeof merged.messageNumberOfLines === 'number'
          ? merged.messageNumberOfLines
          : 3,
    styles: merged.styles || {},
    onClose: typeof merged.onClose === 'function' ? merged.onClose : null,
    onCloseComplete:
      typeof merged.onCloseComplete === 'function' ? merged.onCloseComplete : null,
    onOpen: typeof merged.onOpen === 'function' ? merged.onOpen : null,
    onOpenComplete:
      typeof merged.onOpenComplete === 'function' ? merged.onOpenComplete : null,
  };
}

function hiddenOffsetFor(from, animation) {
  if (
    animation === TOAST_ANIMATIONS.fade ||
    animation === TOAST_ANIMATIONS.none ||
    from === 'center'
  ) {
    return {x: 0, y: 0};
  }
  switch (from) {
    case 'top':
      return {x: 0, y: -HIDDEN};
    case 'left':
      return {x: -HIDDEN, y: 0};
    case 'right':
      return {x: HIDDEN, y: 0};
    case 'bottom':
    default:
      return {x: 0, y: HIDDEN};
  }
}

class ToastCard extends Component {
  constructor(props) {
    super(props);
    const from = animationFromForPosition(props.item.position);
    const anim = props.item.animation || TOAST_ANIMATIONS.spring;
    const hidden = hiddenOffsetFor(from, anim);
    const fades =
      anim === TOAST_ANIMATIONS.fade ||
      anim === TOAST_ANIMATIONS.fadeSlide;
    const scalesFromCenter = from === 'center' && anim !== TOAST_ANIMATIONS.none;

    this.translateX = new Animated.Value(hidden.x);
    this.translateY = new Animated.Value(hidden.y);
    this.opacity = new Animated.Value(fades ? 0 : 1);
    this.scale = new Animated.Value(scalesFromCenter ? 0.94 : 1);
    this._from = from;
    this._anim = anim;
    this._mounted = false;
    this.activeAnimation = null;
    this.hideTimer = null;
  }

  componentDidMount() {
    this._mounted = true;
    this.props.item.onOpen?.();
    this.scheduleAutoHide();

    if (this._anim === TOAST_ANIMATIONS.none) {
      this.props.item.onOpenComplete?.();
      return;
    }

    this.animateIn(() => this.props.item.onOpenComplete?.());
  }

  componentDidUpdate(prevProps) {
    if (prevProps.item !== this.props.item) {
      this.scheduleAutoHide();
    }
  }

  componentWillUnmount() {
    this._mounted = false;
    this.activeAnimation?.stop?.();
    this.activeAnimation = null;
    this.clearHideTimer();
  }

  clearHideTimer() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  scheduleAutoHide() {
    this.clearHideTimer();
    const {duration} = this.props.item;
    if (!duration || duration <= 0) {
      return;
    }
    this.hideTimer = setTimeout(() => {
      this.props.onRequestClose(this.props.item.id);
    }, duration);
  }

  animateIn(done) {
    const useSpring = this._anim === TOAST_ANIMATIONS.spring;
    const motion = value =>
      useSpring
        ? Animated.spring(value, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        })
        : Animated.timing(value, {
          toValue: 0,
          duration: ENTER_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
    const scaleMotion = useSpring
      ? Animated.spring(this.scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 16,
        stiffness: 200,
      })
      : Animated.timing(this.scale, {
        toValue: 1,
        duration: ENTER_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });

    this.activeAnimation = Animated.parallel([
      motion(this.translateX),
      motion(this.translateY),
      Animated.timing(this.opacity, {
        toValue: 1,
        duration: this._anim === TOAST_ANIMATIONS.fade ? 180 : ENTER_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      scaleMotion,
    ]);
    this.activeAnimation.start(({finished}) => {
      this.activeAnimation = null;
      if (!finished || !this._mounted) {
        return;
      }
      this.opacity.setValue(1);
      this.translateX.setValue(0);
      this.translateY.setValue(0);
      this.scale.setValue(1);
      done?.();
    });
  }

  animateOut(done) {
    this.clearHideTimer();
    this.activeAnimation?.stop?.();
    const from = animationFromForPosition(this.props.item.position);
    const animation = this.props.item.animation || TOAST_ANIMATIONS.spring;
    if (animation === TOAST_ANIMATIONS.none) {
      done?.();
      return;
    }

    const hidden = hiddenOffsetFor(from, animation);
    this.activeAnimation = Animated.parallel([
      Animated.timing(this.translateX, {
        toValue: hidden.x,
        duration: EXIT_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(this.translateY, {
        toValue: hidden.y,
        duration: EXIT_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(this.opacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]);
    this.activeAnimation.start(({finished}) => {
      this.activeAnimation = null;
      if (finished && this._mounted) {
        done?.();
      }
    });
  }

  handleCardPress = () => {
    const {item, onRequestClose} = this.props;
    if (!item.onPress) {
      return;
    }
    if (item.pressDismiss) {
      onRequestClose(item.id, () => item.onPress?.());
    } else {
      item.onPress();
    }
  };

  handleActionPress = () => {
    const {item, onRequestClose} = this.props;
    const onPress = item.action?.onPress;
    onRequestClose(item.id, () => onPress?.());
  };

  renderIcon() {
    const {item} = this.props;
    const {icon, iconColor, styles: styleCfg} = item;
    if (icon == null || icon === false) {
      return null;
    }
    if (icon === 'loading') {
      return (
        <View style={[styles.iconWrap, styleCfg.icon]}>
          <ActivityIndicator color={iconColor} size="small"/>
        </View>
      );
    }
    if (typeof icon === 'string') {
      return (
        <View style={[styles.iconWrap, styleCfg.icon]}>
          <Text style={[styles.iconGlyph, {color: iconColor}]}>{icon}</Text>
        </View>
      );
    }
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return (
        <View style={[styles.iconWrap, styleCfg.icon]}>
          <IconComponent color={iconColor}/>
        </View>
      );
    }
    return <View style={[styles.iconWrap, styleCfg.icon]}>{icon}</View>;
  }

  render() {
    const {item} = this.props;
    const {
      title,
      message,
      backgroundColor,
      textColor,
      action,
      closeable,
      legacyCart,
      messageNumberOfLines,
      styles: styleCfg,
    } = item;

    const barStyle = [
      styles.bar,
      legacyCart ? styles.barLegacy : null,
      {backgroundColor},
      styleCfg.bar,
    ];

    const content = (
      <>
        {legacyCart && action?.node ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styleCfg.actionButton,
              action.backgroundColor ? {backgroundColor: action.backgroundColor} : null,
            ]}
            onPress={this.handleActionPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel || 'Action'}
          >
            {action.node}
          </TouchableOpacity>
        ) : (
          this.renderIcon()
        )}

        <View style={styles.textCol}>
          {title ? (
            <Text style={[styles.title, {color: textColor}, styleCfg.title]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {message ? (
            <Text
              style={[
                styles.message,
                {color: textColor},
                title ? styles.messageUnderTitle : null,
                styleCfg.message,
              ]}
              {...(messageNumberOfLines > 0 ? {numberOfLines: messageNumberOfLines} : null)}
            >
              {message}
            </Text>
          ) : null}
        </View>

        {!legacyCart && action?.node ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styleCfg.actionButton,
              action.backgroundColor ? {backgroundColor: action.backgroundColor} : null,
            ]}
            onPress={this.handleActionPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel || 'Action'}
          >
            {action.node}
          </TouchableOpacity>
        ) : null}

        {closeable ? (
          <TouchableOpacity
            style={[styles.closeBtn, styleCfg.closeButton]}
            onPress={() => this.props.onRequestClose(item.id)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel={action?.closeAccessibilityLabel || 'Close'}
          >
            {action?.closeNode || (
              <Text style={[styles.closeGlyph, {color: legacyCart ? '#666' : textColor}]}>×</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </>
    );

    return (
      <Animated.View
        style={[
          styles.cardWrap,
          styleCfg.wrap,
          {
            opacity: this.opacity,
            transform: [
              {translateX: this.translateX},
              {translateY: this.translateY},
              {scale: this.scale},
            ],
          },
        ]}
      >
        {item.onPress ? (
          <Pressable style={barStyle} onPress={this.handleCardPress}>
            {content}
          </Pressable>
        ) : (
          <View style={barStyle}>{content}</View>
        )}
      </Animated.View>
    );
  }
}

class ActionToast extends Component {
  static actionToastInstance;
  static defaults = {};

  constructor(props) {
    super(props);
    this.queue = createToastQueue({
      mode: TOAST_MODES.stack,
      maxVisible: DEFAULT_MAX_VISIBLE,
    });
    this.cardRefs = new Map();
    this.closingIds = new Set();
    this.operationVersion = 0;
    this.dimensionSubscription = null;
    this.state = {items: []};
  }

  componentDidMount() {
    ActionToast.actionToastInstance = this;
    registerActionToastHost(this);
    this.dimensionSubscription = Dimensions.addEventListener?.(
      'change',
      this.handleDimensionChange,
    );
  }

  componentWillUnmount() {
    this.operationVersion += 1;
    this.dimensionSubscription?.remove?.();
    Dimensions.removeEventListener?.('change', this.handleDimensionChange);
    if (ActionToast.actionToastInstance === this) {
      ActionToast.actionToastInstance = null;
    }
    unregisterActionToastHost(this);
  }

  handleDimensionChange = () => {
    this.forceUpdate();
  };

  static _host() {
    return this.actionToastInstance || getActionToastHost();
  }

  static show(config = {}) {
    const host = this._host();
    if (!host) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[popup-confirm-toast] ActionToast: Root is not mounted.');
      }
      return;
    }
    return host.present(config);
  }

  static hide(id) {
    this._host()?.dismiss(id);
  }

  static clear() {
    this._host()?.clearAll();
  }

  static setDefaults(partial = {}) {
    this.defaults = {...this.defaults, ...partial};
    this._host()?.applyDefaults(partial);
  }

  applyDefaults(partial = {}) {
    const snap = this.queue.setDefaults(partial);
    this.setState({items: snap.visible});
  }

  present(config = {}) {
    const defaults = {...this.queue.getDefaults(), ...ActionToast.defaults};
    const item = normalizeConfig(config, defaults);
    const snap = this.queue.enqueue(item, {
      mode: item.mode,
      maxVisible: item.maxVisible,
    });
    this.setState({items: snap.visible});
    return item.id;
  }

  dismiss(id, afterClose) {
    const visibleItems = this.queue.snapshot().visible;
    const targetId =
      id == null && visibleItems.length
        ? visibleItems[visibleItems.length - 1].id
        : id;

    if (targetId == null) {
      afterClose?.();
      return;
    }

    if (this.closingIds.has(targetId)) {
      return;
    }

    this.closingIds.add(targetId);
    const operationVersion = this.operationVersion;
    const card = this.cardRefs.get(targetId);
    const finish = () => {
      this.closingIds.delete(targetId);
      if (operationVersion !== this.operationVersion) {
        return;
      }
      const snap = this.queue.dismiss(targetId);
      const removed = snap.removed;
      removed?.onClose?.();
      this.setState({items: snap.visible}, () => {
        removed?.onCloseComplete?.();
        afterClose?.();
      });
    };

    if (card?.animateOut) {
      card.animateOut(finish);
    } else {
      finish();
    }
  }

  clearAll() {
    this.operationVersion += 1;
    this.closingIds.clear();
    const visibleIds = new Set(this.state.items.map(item => item.id));
    this.state.items.forEach(i => this.cardRefs.get(i.id)?.clearHideTimer?.());
    const snap = this.queue.clear();
    snap.removed?.filter(item => visibleIds.has(item.id)).forEach(item => {
      item.onClose?.();
      item.onCloseComplete?.();
    });
    this.setState({items: []});
  }

  /**
   * Açık boyutlu absolute host ile tüm konumlar güvenli.
   * bottom* için `bottom` (üst üste stack yukarı büyür); top* için `top`.
   */
  getStackContainerStyle(position, offset) {
    const {width: W, height: H} = windowSize();
    const inset = typeof offset === 'number' ? offset : DEFAULT_OFFSET;
    // Modal statusBarTranslucent: top* status bar altına inmeli
    const status = getStatusBarHeight() || 0;
    const cardW = Math.min(W - 32, 360);
    const approxCardH = 64;
    const {isTop, isBottom, isCenter, isLeft, isRight} = positionFromKey(position);

    if (isCenter) {
      return {
        position: 'absolute',
        top: Math.max(0, Math.round(H / 2 - approxCardH / 2)),
        left: 16,
        right: 16,
      };
    }

    if (isTop) {
      const top = Math.round(status + inset);
      if (isLeft) {
        return {position: 'absolute', top, left: 16, width: cardW};
      }
      if (isRight) {
        return {position: 'absolute', top, right: 16, width: cardW};
      }
      return {position: 'absolute', top, left: 16, right: 16};
    }

    // bottom*
    if (isLeft) {
      return {position: 'absolute', bottom: inset, left: 16, width: cardW};
    }
    if (isRight) {
      return {position: 'absolute', bottom: inset, right: 16, width: cardW};
    }
    return {position: 'absolute', bottom: inset, left: 16, right: 16};
  }

  renderStacks() {
    const {items} = this.state;
    const byPosition = {};
    items.forEach(item => {
      const key = item.position || TOAST_POSITIONS.bottom;
      if (!byPosition[key]) {
        byPosition[key] = [];
      }
      byPosition[key].push(item);
    });

    return Object.keys(byPosition).map(position => {
      const group = byPosition[position];
      const offset = group[group.length - 1]?.offset ?? DEFAULT_OFFSET;
      const stackStyle = this.getStackContainerStyle(position, offset);
      const {isBottom} = positionFromKey(position);
      // En yeni kenara yakın
      const ordered = isBottom ? [...group] : [...group].reverse();

      return (
        <View key={position} pointerEvents="box-none" style={[styles.stack, stackStyle]}>
          {ordered.map((item, index) => (
            <View
              key={item.id}
              style={
                isBottom
                  ? {marginBottom: index === ordered.length - 1 ? 0 : STACK_GAP}
                  : {marginTop: index === 0 ? 0 : STACK_GAP}
              }
            >
              <ToastCard
                ref={c => {
                  if (c) {
                    this.cardRefs.set(item.id, c);
                  } else {
                    this.cardRefs.delete(item.id);
                  }
                }}
                item={item}
                onRequestClose={(toastId, after) => this.dismiss(toastId, after)}
              />
            </View>
          ))}
        </View>
      );
    });
  }

  renderOverlayBody() {
    const sized = windowSize();
    return (
      <View
        style={[styles.overlayFill, sized]}
        pointerEvents="box-none"
        collapsable={false}
      >
        <View
          style={[styles.host, sized]}
          pointerEvents="box-none"
          collapsable={false}
        >
          {this.renderStacks()}
        </View>
      </View>
    );
  }

  render() {
    const visible = this.state.items.length > 0;
    const body = visible ? this.renderOverlayBody() : null;

    if (Platform.OS === 'ios') {
      if (!visible) {
        return null;
      }
      return <FullWindowOverlay>{body}</FullWindowOverlay>;
    }

    // Android/Web: native stack header'ın üstünde çizmek için Modal
    // (iOS FullWindowOverlay eşdeğeri). Absolute overlay üst/orta toast'ları
    // header altında bırakıyordu.
    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        hardwareAccelerated
        onRequestClose={() => this.clearAll()}
      >
        <View
          pointerEvents="box-none"
          collapsable={false}
          style={styles.androidModalRoot}
        >
          {body}
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  androidModalRoot: {
    flex: 1,
  },
  overlayFill: {
    flex: 1,
  },
  host: {
    flex: 1,
    elevation: 100000,
    zIndex: 100000,
  },
  stack: {
    zIndex: 100001,
    elevation: 100001,
  },
  cardWrap: {
    width: '100%',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: Platform.OS === 'android' ? 0 : StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    elevation: 8,
  },
  barLegacy: {
    borderColor: '#EFEFEF',
    borderWidth: Platform.OS === 'android' ? 0 : 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconGlyph: {
    fontSize: 18,
    fontWeight: '700',
  },
  textCol: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  messageUnderTitle: {
    marginTop: 2,
    fontWeight: '500',
    fontSize: 14,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D6001F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginLeft: 4,
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
    fontWeight: '500',
  },
});

export default ActionToast;
export {
  TOAST_POSITIONS,
  TOAST_ANIMATIONS,
  TOAST_MODES,
};
