import React, {Component} from 'react';
import {Animated, Dimensions, Easing, Platform, StatusBar, StyleSheet, Text, View} from 'react-native';
import {getStatusBarHeight, isIPhoneWithMonobrow} from 'react-native-status-bar-height';

const defaultTiming = 5000;
const defaultColor = '#1f3676';
const defaultBackgroundColor = '#1da1f2';
const defaultTimeColor = '#122459';
const defaultPosition = 'bottom';
const defaultMinHeight = 120;

const iosHeight = 30;

const heightTopGeneral = getStatusBarHeight();

class Toast extends Component {
    static toastInstance;

    constructor(props) {
        super(props);

        this.height = Platform.OS === 'android' ? Dimensions.get('screen').height - StatusBar.currentHeight : Dimensions.get('window').height;
        this.width = Platform.OS === 'android' ? Dimensions.get('screen').width : Dimensions.get('window').width;

        this.defaultState = {

            color: defaultColor,
            timeColor: defaultTimeColor,
            position: defaultPosition,
            start: false,
            minHeight: defaultMinHeight,

            statusBarHidden: false,
            hiddenDuration: 200,
            startDuration: 200,
        };

        this.state = {
            ...this.defaultState,
            toast: new Animated.Value(this.height),
            time: new Animated.Value(0),
        };
    }

    static show({...config}) {
        this.toastInstance.start(config);
    }

    static hide() {
        this.toastInstance.hideToast();
    }

    start({...config}) {
        this.setState({
            ...this.defaultState,
            title: config.title || false,
            text: config.text || false,
            titleTextStyle: config.titleTextStyle || false,
            descTextStyle: config.descTextStyle || false,
            backgroundColor: config.backgroundColor ? config.backgroundColor : defaultBackgroundColor,
            timeColor: config.timeColor ? config.timeColor : defaultTimeColor,
            position: config.position ? config.position : defaultPosition,
            icon: config.icon || false,
            timing: config.timing || 5000,
            type: config.type,
            start: true,
        });

    }

    runStart() {
        let {minHeight, position, startDuration} = this.state;
        let toValue;
        if (position === 'top') {
            toValue = -25;
            minHeight = minHeight + (heightTopGeneral - (isIPhoneWithMonobrow() ? 20 : 0));
        } else if (position === 'bottom') {
            toValue = this.height - (minHeight);
        }
        this.setState({
            start: false,
            toast: new Animated.Value(position === 'top' ? -minHeight : this.height),
        }, () => {
            Animated.spring(this.state.toast, {
                toValue: toValue,
                bounciness: 0,
                useNativeDriver: true,
                easing: Easing.linear,
                duration: startDuration,
            }).start();
            this.runTiming();
        });
    }

    runTiming() {
        const {timing, time} = this.state;
        Animated.timing(this.state.time, {
            toValue: -this.width,
            duration: timing,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(() => this.hideToast());
    }

    hideToast() {
        const {minHeight} = this.state;
        let toValue = 0;
        if (this.state.position === 'top') {
            toValue = -minHeight;
        } else if (this.state.position === 'bottom') {
            toValue = this.height;
        }
        Animated.sequence([
            Animated.timing(this.state.toast, {
                toValue: toValue,
                duration: this.state.hiddenDuration,
                useNativeDriver: true,
            }),
            Animated.timing(this.state.time, {
                toValue: 0,
                duration: 0,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ]).start(() => {

        });
    }

    render() {
        const {
            title, text, icon, backgroundColor, timeColor, position, titleTextStyle, descTextStyle,
            statusBarHidden, minHeight, start,
        } = this.state;
        return (
            <>
                <StatusBar hidden={statusBarHidden} animated={true} translucent={true}/>
                <Animated.View
                    ref={c => this._root = c}
                    style={[
                        styles.toast,
                        {
                            width: this.width,
                            minHeight: minHeight,
                            backgroundColor: backgroundColor,
                            transform: [{translateY: this.state.toast}],
                        },
                    ]}
                >
                    <Animated.View
                        style={[
                            {
                                flexDirection: 'row',
                                justifyContent: 'center',
                                flex: 1,
                            },
                            (position === 'top' ? {paddingTop: (heightTopGeneral + 20)} : {}),
                            (position === 'bottom' ? {paddingBottom: (isIPhoneWithMonobrow() ? 10 : 20)} : {}),
                        ]}
                        onLayout={event => {
                            if (start) {
                                const height = event.nativeEvent.layout.height;
                                this.setState({minHeight: (height + 20)}, () => {
                                    this.runStart();
                                });
                            }
                        }}
                    >
                        {
                            icon && (
                                <View style={[styles.iconStatus]}>
                                    {icon}
                                </View>
                            )
                        }
                        <View style={[styles.content]}>
                            {
                                title && title.length > 0 && (
                                    <Text style={[styles.title, titleTextStyle]}>{title}</Text>
                                )
                            }
                            {
                                text && text.length > 0 && (
                                    <Text style={[styles.subtitle, descTextStyle]}>{text}</Text>
                                )
                            }
                        </View>
                        <Animated.View
                            style={[
                                styles.timing,
                                {
                                    backgroundColor: timeColor,
                                    transform: [{translateX: this.state.time}],
                                },
                                (position === 'top' ? {bottom: -11} : {top: -10}),
                            ]}
                        />
                    </Animated.View>
                </Animated.View>
            </>
        );
    }
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        width: '100%',
        alignSelf: 'center',
        borderRadius: 0,
        shadowColor: defaultBackgroundColor,
        alignItems: 'center',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        flexDirection: 'row',
    },
    timing: {
        height: 5,
        width: '100%',
        backgroundColor: defaultTimeColor,
        position: 'absolute',
    },
    content: {
        flex: 1,
        paddingLeft: 20,
        paddingRight: 20,
        marginTop: 0,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    subtitle: {
        marginTop: 5,
        fontSize: 13,
        color: '#fff',
        fontWeight: '400',
    },
    img: {
        resizeMode: 'contain',
        width: 20,
        height: 20,
    },
    iconStatus: {
        marginLeft: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Toast;
