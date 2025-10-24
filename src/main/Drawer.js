import React, {Component} from 'react';
import {Animated, Dimensions, Easing, Platform, StyleSheet, TouchableWithoutFeedback, View} from 'react-native';

const defaultBackgroundColor = 'rgba(0, 0, 0, 0.5)';
const defaultDrawerColor = '#ffffff';
const defaultPosition = 'left';

class Drawer extends Component {
  static drawerInstance;

  constructor(props) {
    super(props);

    this.width = Platform.OS === 'android' ? Dimensions.get('screen').width : Dimensions.get('window').width;
    this.height = Platform.OS === 'android' ? Dimensions.get('screen').height : Dimensions.get('window').height;

    this.defaultState = {
      backgroundColor: defaultBackgroundColor,
      drawerColor: defaultDrawerColor,
      position: defaultPosition,
      drawerWidth: this.width * 0.8,
      start: false,
      starting: false,
      component: null,
      onOpen: false,
      onOpenComplete: false,
      onClose: false,
      onCloseComplete: false,
      duration: 300,
      backdropPressToClose: true,
    };

    this.state = {
      ...this.defaultState,
      drawerPosition: new Animated.Value(this.getInitialPosition()),
      opacity: new Animated.Value(0),
    };

    this.updateDimensions = this.updateDimensions.bind(this);
  }

  static show({...config}) {
    this.drawerInstance.start(config);
  }

  static hide() {
    this.drawerInstance.hideDrawer();
  }

  componentDidMount() {
    this.dimensionsSubscription = Dimensions.addEventListener('change', this.updateDimensions);
  }

  componentWillUnmount() {
    this.dimensionsSubscription?.remove();
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

  getInitialPosition() {
    const {position, drawerWidth} = this.state || this.defaultState;
    switch (position) {
      case 'left':
        return -this.width;
      case 'right':
        return this.width;
      case 'top':
        return -this.height;
      case 'bottom':
        return this.height;
      default:
        return -this.width;
    }
  }

  start({...config}) {
    if (this.state.starting) {
      return;
    }

    this.setState({
      ...this.defaultState,
      backgroundColor: config.backgroundColor || defaultBackgroundColor,
      drawerColor: config.drawerColor || defaultDrawerColor,
      position: config.position || defaultPosition,
      drawerWidth: config.drawerWidth || this.width * 0.8,
      component: config.component || null,
      onOpen: config.onOpen || false,
      onOpenComplete: config.onOpenComplete || false,
      onClose: config.onClose || false,
      onCloseComplete: config.onCloseComplete || false,
      duration: config.duration || 300,
      backdropPressToClose: typeof config.backdropPressToClose !== 'undefined' ? config.backdropPressToClose : true,
      start: true,
      starting: true,
    }, () => {
      if (typeof this.state.onOpen === 'function') {
        this.state.onOpen();
      }
      this.runStart();
    });
  }

  runStart() {
    const {duration, position} = this.state;

    this.setState({
      start: false,
      drawerPosition: new Animated.Value(this.getInitialPosition()),
    }, () => {
      Animated.parallel([
        Animated.timing(this.state.opacity, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
        Animated.timing(this.state.drawerPosition, {
          toValue: 0,
          duration: duration,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
      ]).start(() => {
        if (typeof this.state.onOpenComplete === 'function') {
          this.state.onOpenComplete();
        }
      });
    });
  }

  hideDrawer() {
    if (!this.state.starting) {
      return;
    }

    if (typeof this.state.onClose === 'function') {
      this.state.onClose();
    }

    const {duration, onCloseComplete} = this.state;
    const initialPosition = this.getInitialPosition();

    Animated.parallel([
      Animated.timing(this.state.drawerPosition, {
        toValue: initialPosition,
        duration: duration,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(this.state.opacity, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start(() => {
      this.setState({
        ...this.defaultState,
        drawerPosition: new Animated.Value(this.getInitialPosition()),
        opacity: new Animated.Value(0),
      }, () => {
        if (onCloseComplete && typeof onCloseComplete === 'function') {
          onCloseComplete();
        }
      });
    });
  }

  getDrawerStyle() {
    const {position, drawerWidth, drawerColor} = this.state;
    const baseStyle = {
      backgroundColor: drawerColor,
      position: 'absolute',
    };

    switch (position) {
      case 'left':
        return {
          ...baseStyle,
          width: drawerWidth,
          height: this.height,
          left: 0,
          top: 0,
          transform: [{translateX: this.state.drawerPosition}],
        };
      case 'right':
        return {
          ...baseStyle,
          width: drawerWidth,
          height: this.height,
          right: 0,
          top: 0,
          transform: [{translateX: this.state.drawerPosition}],
        };
      case 'top':
        return {
          ...baseStyle,
          width: this.width,
          height: drawerWidth,
          top: 0,
          left: 0,
          transform: [{translateY: this.state.drawerPosition}],
        };
      case 'bottom':
        return {
          ...baseStyle,
          width: this.width,
          height: drawerWidth,
          bottom: 0,
          left: 0,
          transform: [{translateY: this.state.drawerPosition}],
        };
      default:
        return baseStyle;
    }
  }

  render() {
    const {backgroundColor, component, starting, backdropPressToClose} = this.state;
    const DrawerComponent = component;

    return (
        <Animated.View
            ref={c => this._root = c}
            pointerEvents={starting ? 'auto' : 'none'}
            style={[
              styles.container,
              {
                width: this.width,
                height: this.height,
                backgroundColor: backgroundColor,
                opacity: this.state.opacity,
              },
              !starting ? {display: 'none'} : {},
            ]}
        >
          <TouchableWithoutFeedback
              onPress={() => {
                if (backdropPressToClose) {
                  this.hideDrawer();
                }
              }}
          >
            <View style={styles.backdrop}/>
          </TouchableWithoutFeedback>

          <Animated.View style={[styles.drawer, this.getDrawerStyle()]}>
            {DrawerComponent && <DrawerComponent onClose={() => this.hideDrawer()}/>}
          </Animated.View>
        </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99998,
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  drawer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default Drawer;
