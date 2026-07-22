import React, {Component} from 'react';
import {View} from 'react-native';

import PropTypes from 'prop-types';
import Popup from './Popup';
import ActionToast from './ActionToast';
import SPSheet from './SPSheet';
import Drawer from './Drawer';

/**
 * Mount order: ActionToast is last among overlays. On iOS it renders through
 * FullWindowOverlay; on other platforms it stays as the last absolute overlay.
 *
 * Overlays are NOT dismissed on AppState background — confirm/sheet should stay
 * open when the user returns to the app.
 */
class Root extends Component {
  render() {
    return (
      <View style={[rootStyles.root, this.props.style]} pointerEvents="box-none">
        {this.props.children}
        <Drawer
          ref={c => {
            if (c) {
              Drawer.drawerInstance = c;
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
        <Popup
          ref={c => {
            if (c) {
              Popup.popupInstance = c;
            }
          }}
        />
        <ActionToast
          ref={c => {
            if (c) {
              ActionToast.actionToastInstance = c;
            }
          }}
        />
      </View>
    );
  }
}

Root.propTypes = {
  style: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.number,
    PropTypes.array,
  ]),
};

const rootStyles = {
  root: {
    flex: 1,
  },
};

export default Root;
