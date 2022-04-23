import React, {Component} from 'react';
import {Dimensions, View, ViewPropTypes} from 'react-native';
import PropTypes from 'prop-types';
import Popup from './Popup';
import Toast from './Toast';
import SPSheet from './SPSheet';

const {width, height} = Dimensions.get('window');

class Root extends Component {
    render() {
        return (
            <>
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
            </>
        );
    }
}

Root.propTypes = {
    ...ViewPropTypes,
    style: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.number,
        PropTypes.array
    ])
}

export default Root
