import React, {Component} from 'react';
import {View, ViewPropTypes} from 'react-native';
import PropTypes from 'prop-types';
import Popup from './Popup';
import Toast from './Toast';
import SPSheet from './SPSheet';


class Root extends Component {

    render() {
        return (
            <View
                ref={c => (this._root = c)}
                style={{flex: 1}}
                {...this.props}
            >
                {this.props.children}
                <Popup
                    ref={c => {
                        console.log('Popup',c);
                        if (c) {
                            Popup.popupInstance = c;
                        }
                    }}
                />

                <Toast
                    ref={c => {
                        console.log('Toast',c);
                        if (c) {
                            Toast.toastInstance = c;
                        }
                    }}
                />

                <SPSheet
                    ref={c => {
                        console.log('c',c);
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
        PropTypes.array
    ])
}

export default Root
