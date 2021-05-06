import React, {Component} from 'react';
import {Animated, Dimensions, Easing, Platform, StatusBar, StyleSheet, Text, View} from 'react-native';
import {getStatusBarHeight, isIPhoneWithMonobrow} from 'react-native-status-bar-height';

const {width, height} = Dimensions.get('window');

const defaultTiming = 5000;
const defaultColor = '#fff';
const defaultBackgroundColor = '#1da1f2';
const defaultTimeColor = '#1c6896';
const defaultPosition = 'bottom';
const defaultMinHeight = 120;
let minHeight = defaultMinHeight;

const iosHeight = 30;

const heightTopGeneral = (isIPhoneWithMonobrow()) ? getStatusBarHeight() : 0;

class Toast extends Component {
    static toastInstance;
    state = {
        toast: new Animated.Value(height),
        time: new Animated.Value(0),
        color: defaultColor,
        timeColor: defaultTimeColor,
        position: defaultPosition,
        start: false,
    };

    static show({...config}) {
        this.toastInstance.start(config);
    }

    static hide() {
        this.toastInstance.hideToast();
    }

    start({...config}) {
        let toValue;
        if (config.position == 'top') {
            toValue = -25;
            minHeight = minHeight + (heightTopGeneral - (isIPhoneWithMonobrow() ? 20 : 0));
        } else if (config.position == 'bottom') {
            minHeight = minHeight - (Platform.OS == 'android' ? 0 : iosHeight);
            toValue = height - (minHeight);
        }

        this.setState({
            ...this.state,
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
            toast: new Animated.Value(config.position == 'top' ? -minHeight : height),
            start: true,
        }, () => {
            Animated.spring(this.state.toast, {
                toValue: toValue,
                bounciness: 0,
                useNativeDriver: true,
                easing: Easing.linear,
            }).start();
            this.runTiming();
        });

    }

    runTiming() {
        const {timing, time} = this.state;
        Animated.timing(
            time,
            {
                toValue: width,
                duration: timing,
                easing: Easing.linear,
                useNativeDriver: false,
            },
        ).start(() => this.hideToast());
    }

    hideToast() {

        let toValue = height + 500;
        if (this.state.position == 'top') {
            toValue = -20;
        }

        Animated.timing(this.state.toast, {
            toValue: toValue,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            this.setState({
                timing: defaultTiming,
                toast: new Animated.Value(this.state.position == 'top' ? -minHeight : height),
                time: new Animated.Value(0),
                start: false,
            }, () => {
                minHeight = defaultMinHeight;
            });
        });
    }

    render() {
        const {
            title, text, icon, backgroundColor, timeColor, time, position, start, titleTextStyle, descTextStyle,
        } = this.state;

        if (!start) {
            return null;
        }

        let marginTop = {};
        if (position == 'top') {
            marginTop = isIPhoneWithMonobrow() ? {marginTop: -iosHeight} : {marginTop: -10};
        } else if (position == 'bottom') {
            marginTop = Platform.OS == 'android' ? {marginTop: -20} : {};
        }

        return (
            <>
                <StatusBar hidden={start && position == 'top' ? true : false} animated={true}/>
                <Animated.View
                    ref={(c) => (this._root = c)}
                    style={[
                        styles.toast,
                        {
                            height: minHeight,
                            backgroundColor: backgroundColor,
                            transform: [{translateY: this.state.toast}],
                        },
                        (position == 'top' ? {paddingTop: (heightTopGeneral + 20)} : {}),
                    ]}
                >
                    <View style={[
                        {flexDirection: 'row', justifyContent: 'center'},
                        marginTop,
                    ]}>
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
                    </View>


                    <Animated.View
                        style={[
                            styles.timing,
                            {
                                backgroundColor: timeColor,
                                right: time,
                            },
                            (position == 'top' ? {bottom: 0} : {top: 0}),
                        ]}
                    />
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
