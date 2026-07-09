import React, {Component} from 'react';

import PropTypes from 'prop-types';
import Popup from './Popup';
import Toast from './Toast';
import ActionToast from './ActionToast';
import SPSheet from './SPSheet';
import Drawer from './Drawer';

/**
 * Mount order matters on iOS: later Modals stack above earlier ones.
 * Popup must be last so standalone alerts appear above SPSheet / Drawer.
 * (When sheet is open, Popup portals inside SPSheet Modal instead.)
 */
class Root extends Component {
  render() {
    return (
      <>
        {this.props.children}
        <Toast
          ref={c => {
            if (c) {
              Toast.toastInstance = c;
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
      </>
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

export default Root;
