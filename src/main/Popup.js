import React, {Component} from 'react';
import {Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

export const {width: WIDTH, height: HEIGHT} = Dimensions.get('window');

class Popup extends Component {
    static popupInstance;

    constructor(props) {
        super(props);

        this.defaultState = {
            positionView: new Animated.Value(HEIGHT),
            opacity: new Animated.Value(0),
            positionPopup: new Animated.Value(HEIGHT),
            popupHeight: 0,
            bounciness: 15,
            title: false,
            type: 'warning',
            buttonEnabled: true,
            textBody: false,
            bodyComponent: false,
            buttonText: 'Ok',
            confirmText: 'Cancel',
            callback: () => this.hidePopup(),
            background: 'rgba(0, 0, 0, 0.5)',
            timing: 0,
            iconEnabled: true,
            icon: false,
            modalContainerStyle: false,
            buttonContentStyle: false,
            okButtonStyle: false,
            confirmButtonStyle: false,
            okButtonTextStyle: false,
            confirmButtonTextStyle: false,
            titleTextStyle: false,
            descTextStyle: false,
            start: false,
        };

        this.state = this.defaultState;

    }

    static show({...config}) {
        this.popupInstance.start(config);
    }

    static hide() {
        this.popupInstance.hidePopup();
    }

    start({...config}) {

        this.setState({
            ...this.defaultState,
            ...config,
            start: true,
        });
    }

    startPopup() {
        this.setState({
            start: false,
        }, () => {
            Animated.sequence([
                Animated.timing(this.state.positionView, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: false,
                }),
                Animated.timing(this.state.opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.spring(this.state.positionPopup, {
                    toValue: (HEIGHT / 2) - (this.state.popupHeight / 2),
                    bounciness: this.state.bounciness,
                    useNativeDriver: true,
                }),
            ]).start();

            if (this.state.timing !== 0) {
                const duration = this.state.timing > 0 ? this.state.timing : 5000;
                setTimeout(() => {
                    this.hidePopup();
                }, duration);
            }
        });
    }

    hidePopup() {
        const {positionPopup, opacity, positionView} = this.state;
        Animated.sequence([
            Animated.timing(positionPopup, {
                toValue: HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(positionView, {
                toValue: HEIGHT,
                duration: 100,
                useNativeDriver: false,
            }),
        ]).start(() => {
            this.setState(this.defaultState);
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
        }
    }

    render() {
        const {title, type, textBody, buttonEnabled, buttonText, confirmText, callback, background, iconEnabled, start} = this.state;
        const {bodyComponent, modalContainerStyle, positionPopup, positionView, opacity} = this.state;

        const typeName = type + 'ButtonStyle';

        const BodyComponentElement = bodyComponent ? bodyComponent : false;

        return (
            <Animated.View
                ref={c => this._root = c}
                style={[styles.Container, {
                    backgroundColor: background || 'transparent',
                    opacity: opacity,
                    transform: [
                        {translateY: positionView},
                    ],
                }]}>
                <Animated.View
                    onLayout={event => {
                        if (start) {
                            const height = event.nativeEvent.layout.height;
                            this.setState({popupHeight: height}, () => {
                                this.startPopup();
                            });
                        }
                    }}
                    style={
                        [
                            styles.Message,
                            modalContainerStyle,
                            {
                                transform: [
                                    {translateY: positionPopup},
                                ],
                            },
                        ]
                    }
                >
                    {
                        iconEnabled && (
                            <>
                                <View style={styles.Header}/>
                                <Image
                                    source={this.handleImage(type)}
                                    resizeMode="contain"
                                    style={styles.Image}
                                />
                            </>
                        )
                    }
                    <View style={styles.Content}>
                        {
                            title && title.length > 0 && (
                                <Text style={[styles.Title, this.state.titleTextStyle]}>{title}</Text>
                            )
                        }
                        <Text style={[styles.Desc, this.state.descTextStyle]}>{textBody}</Text>
                        {
                            BodyComponentElement ? (
                                <BodyComponentElement {...this.props} />
                            ) : null
                        }
                        <View style={this.state.buttonContentStyle}>
                            {
                                buttonEnabled && (
                                    <TouchableOpacity style={[styles.Button, styles[typeName], this.state.okButtonStyle]} onPress={() => {
                                        if (typeof callback == 'function') {
                                            return callback();
                                        }
                                    }}>
                                        <Text style={[styles.TextButton, this.state.okButtonTextStyle]}>{buttonText}</Text>
                                    </TouchableOpacity>
                                )
                            }
                            {
                                type === 'confirm' && (
                                    <>
                                        <TouchableOpacity style={[styles.Button, styles.confirm, this.state.confirmButtonStyle]} onPress={() => this.hidePopup()}>
                                            <Text style={[styles.TextButton, styles[type + 'Text'], this.state.confirmButtonTextStyle]}>{confirmText}</Text>
                                        </TouchableOpacity>
                                    </>
                                )
                            }
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    Container: {
        position: 'absolute',
        zIndex: 9,
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        top: 0,
        left: 0,
    },
    Message: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        overflow: 'hidden',
        position: 'absolute',
    },
    Content: {
        padding: 20,
        width: '100%',
    },
    Header: {
        height: 75,
        width: 100,
        backgroundColor: '#fff',
    },
    Image: {
        width: 48,
        height: 48,
        position: 'absolute',
        top: 20,
    },
    Title: {
        color: '#1e1e1e',
        fontSize: 18,
        fontWeight: '600',
        fontStyle: 'normal',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 10,
    },
    Desc: {
        color: '#111111',
        fontSize: 16,
        fontWeight: '400',
        fontStyle: 'normal',
        textAlign: 'center',
        lineHeight: 24,
    },
    Button: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        borderRadius: 8,
        backgroundColor: '#702c91',
    },
    TextButton: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'normal',
        textAlign: 'center',
        lineHeight: 20,
    },
    successButtonStyle: {
        backgroundColor: '#702c91',
    },
    dangerButtonStyle: {
        backgroundColor: '#702c91',
    },
    warningButtonStyle: {
        backgroundColor: '#702c91',
    },
    confirmButtonStyle: {
        backgroundColor: '#702c91',
    },
    confirm: {
        backgroundColor: 'transparent',
    },
    confirmText: {
        color: '#111111',
    },

});

export default Popup;
