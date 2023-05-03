import React, {Component} from 'react';
import {Animated, BackHandler, Dimensions, Easing, Keyboard, PanResponder, Platform, StyleSheet, TouchableOpacity, View} from 'react-native';
// - StatusBar.currentHeight
const HEIGHT = Platform.OS === 'android' ? Dimensions.get('screen').height : Dimensions.get('window').height;
const WIDTH = Platform.OS === 'android' ? Dimensions.get('screen').width : Dimensions.get('window').width;

const minPopupHeight = 100;

const defaultState = {
  height: minPopupHeight,
  start: false,
  customStyles: {
    draggableIcon: {},
    container: {},
  },
  pan: new Animated.ValueXY(),
  positionView: new Animated.Value(HEIGHT),
  positionPopup: new Animated.Value(HEIGHT),
  opacity: new Animated.Value(0),
  background: 'rgba(0, 0, 0, 0.5)',
  duration: 250,
  closeDuration: 300,
  closeOnDragDown: true,
  closeOnPressMask: true,
  closeOnPressBack: true,
  dragTopOnly: false,
  component: false,
  open: false,
  onCloseComplete: false,
  onClose: false,
  onOpenComplete: false,
  onOpen: false,
  marginBottom: new Animated.Value(0),
  keyboardHeightAdjustment: false,
};

class SPSheet extends Component {

  static spsheetInstance;

  constructor(props) {
    super(props);

    this.state = defaultState;
    this.createPanResponder();

    this.keyboardDidShow = this.keyboardDidShow.bind(this);
    this.keyboardDidHide = this.keyboardDidHide.bind(this);
  }

  static show({...config}) {
    this.spsheetInstance.start(config);
  }

  static hide() {
    this.spsheetInstance.hidePopup();
  }

  static setHeight(height, completeEvent = false) {
    this.spsheetInstance.setHeight(height, completeEvent);
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButton());
    this.keyboardDidShowSubscription = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
    this.keyboardDidHideSubscription = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', () => this.handleBackButton());
    this.keyboardDidShowSubscription.remove();
    this.keyboardDidHideSubscription.remove();

  }

  keyboardDidShow(e) {
    if (this.state.keyboardHeightAdjustment) {
      let newSize = e.endCoordinates.height;
      this.setState({
        marginBottom: new Animated.Value(newSize),
      });
    }
  }

  keyboardDidHide(e) {
    const {marginBottom, keyboardHeightAdjustment, duration} = this.state;
    if (keyboardHeightAdjustment) {
      Animated.spring(marginBottom, {
        toValue: 0,
        duration: 0,
        bounciness: 0,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => {
        this.setState({
          marginBottom: new Animated.Value(0),
        });
      });
    }
  }

  handleBackButton() {
    let {open, closeOnPressBack} = this.state;
    if (open && closeOnPressBack) {
      this.hidePopup();
      return true;
    }
  }

  start({...config}) {

    const start = config.height > 0 ? false : true;

    this.setState({
      ...defaultState,
      open: true,
      start: start,
      ...config,
    }, () => {
      if (start === false) {
        this.startPopup();
      }
    });
  }

  startPopup() {
    const {positionPopup, positionView, opacity, height, duration, onOpenComplete, onOpen} = this.state;
    this.setState({
      start: false,
    }, () => {
      if (typeof onOpen === 'function') {
        return onOpen(this.props);
      }
      Animated.sequence([
        Animated.timing(positionView, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: false,
        }),
        Animated.spring(positionPopup, {
          toValue: HEIGHT - height,
          duration: duration,
          bounciness: 0,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]).start(() => {
        if (typeof onOpenComplete === 'function') {
          return onOpenComplete(this.props);
        }
      });
    });
  }

  hidePopup() {
    const {pan, closeDuration, onCloseComplete, positionPopup, open} = this.state;

    if (open) {
      if (typeof onClose === 'function') {
        onClose(this.props);
      }
      Animated.sequence([
        Animated.timing(positionPopup, {
          toValue: HEIGHT,
          duration: closeDuration,
          useNativeDriver: false,
        }),
        Animated.timing(this.state.opacity, {
          toValue: 0,
          duration: closeDuration,
          useNativeDriver: false,
        }),
        Animated.timing(this.state.positionView, {
          toValue: HEIGHT,
          duration: 100,
          useNativeDriver: false,
        }),
      ]).start(() => {
        this.setState({
          ...defaultState,
          height: 0,
        }, () => {
          pan.setValue({x: 0, y: 0});
          if (typeof onCloseComplete === 'function') {
            onCloseComplete(this.props);
          }
        });
      });
    }

  }

  setHeight(height, completeEvent = false) {
    const currentHeight = this.state.height;
    const {positionPopup, opacity, duration, closeDuration} = this.state;

    this.setState({
      height: height > currentHeight ? height : currentHeight,
      start: false,
    }, () => {
      Animated.sequence([
        Animated.timing(this.state.positionView, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(positionPopup, {
          toValue: HEIGHT - height,
          duration: closeDuration,
          useNativeDriver: false,
        }),
      ]).start(() => {
        this.setState({
          height: height,
          start: false,
        }, () => {
          setTimeout(() => {
            if (typeof completeEvent === 'function') {
              completeEvent(this.props);
            }
          }, closeDuration);
        });
      });
    });

  }

  createPanResponder() {
    const {pan, closeOnDragDown, height} = this.state;
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => closeOnDragDown,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy > 0) {
          Animated.event([null, {dy: pan.y}], {useNativeDriver: false})(e, gestureState);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (height / 4 - gestureState.dy < 0) {
          this.hidePopup();
        } else {
          Animated.spring(pan, {toValue: {x: 0, y: 0}, useNativeDriver: false}).start();
        }
      },
    });
  }

  render() {

    const {
      open, closeOnDragDown, dragTopOnly, closeOnPressMask, component, customStyles, pan, height, start, background, opacity, positionView, positionPopup, marginBottom,
    } = this.state;

    if (!open) {
      return null;
    }

    const BodyComponentElement = component ? component : false;
    const panResponder = this.panResponder;

    return (
        <Animated.View
            ref={c => this._root = c}
            style={[
              styles.modalContainer, {
                backgroundColor: background || 'transparent',
                opacity: opacity,
                transform: [
                  {
                    translateY: positionView,
                  },
                ],
              },
            ]}>

          <Animated.View
              style={[{height: positionPopup}]}
          >
            <TouchableOpacity
                style={[
                  styles.mask,
                ]}
                activeOpacity={1}
                onPress={() => (closeOnPressMask ? this.hidePopup() : null)}
            />
          </Animated.View>

          <View
              onLayout={event => {
                if (start) {
                  const height = event.nativeEvent.layout.height;
                  this.setState({height: height < minPopupHeight ? minPopupHeight : height}, () => {
                    this.startPopup();
                  });
                }
              }}
          >
            <Animated.View
                {...(!dragTopOnly && panResponder?.panHandlers)}
                style={[
                  styles.container,
                  {
                    height: height,
                    transform: [{translateX: pan.x}, {translateY: pan.y}],
                    bottom: marginBottom,
                  },
                  customStyles.container,
                ]}
            >
              {
                  closeOnDragDown && (
                      <View {...(dragTopOnly && panResponder?.panHandlers)} style={[styles.draggableContainer, customStyles.draggableContainer]}>
                        <View style={[styles.draggableIcon, customStyles.draggableIcon]}/>
                      </View>
                  )
              }
              {
                BodyComponentElement ? (
                    <BodyComponentElement {...this.props} />
                ) : null
              }
            </Animated.View>
          </View>
        </Animated.View>

    );
  }
}

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    zIndex: 9,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    top: 0,
    left: 0,
  },
  container: {
    width: '100%',
    shadowRadius: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    elevation: 4,
  },
  mask: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  draggableContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  draggableIcon: {
    height: 5,
    borderRadius: 8,
    margin: 10,
    backgroundColor: '#343a40',
    width: 94,
  },
});

export default SPSheet;
