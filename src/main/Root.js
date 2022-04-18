import React, {Component} from 'react';
import {Dimensions, View, ViewPropTypes} from 'react-native';
import PropTypes from 'prop-types';
import Popup from './Popup';
import Toast from './Toast';
import SPSheet from './SPSheet';

const window = Dimensions.get('window');
const width = window.width;
const height = window.height;

class Root extends Component {
    render() {
        return (
            <View
                ref={c => (this._root = c)}
                style={{width: width, height: height}}
            >
                {this.props.children}
                <Popup
                    ref={c => {
                        if (c) {
                            Popup.popupInstance = c;
                        }
                    }}
                />

                <Toast
                    ref={c => {
                        if (c) {
                            Toast.toastInstance = c;
                        }
                    }}
                />
                <SPSheet
                    ref={c => {
                        if (c) {
                            SPSheet.spsheetInstance = c;
                        }
                    }}
                />
            </View>
        );
    }
}

Root.propTypes = {
    ...ViewPropTypes,
    style: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.number,
        PropTypes.array,
    ]),
};

export default Root;
