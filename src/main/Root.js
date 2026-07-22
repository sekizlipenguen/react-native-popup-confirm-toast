import React, {Component} from 'react';
import {AppState, Dimensions, View} from 'react-native';

import PropTypes from 'prop-types';
import Popup from './Popup';
import ActionToast from './ActionToast';
import Toast from './Toast';
import SPSheet from './SPSheet';
import Drawer from './Drawer';
import OverlayBus from './OverlayBus';

/**
 * Mount order: ActionToast is last among overlays. On iOS it renders through
 * FullWindowOverlay; on other platforms it stays as the last absolute overlay.
 *
 * Also tears down overlays when the app backgrounds or the window shrinks to a
 * PiP-sized surface (Android Picture-in-Picture can otherwise leave a ghost Modal).
 */
class Root extends Component {
  componentDidMount() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
    this.dimensionsSubscription = Dimensions.addEventListener(
      'change',
      this.handleDimensionsChange,
    );
  }

  componentWillUnmount() {
    this.appStateSubscription?.remove?.();
    this.dimensionsSubscription?.remove?.();
  }

  handleAppStateChange = nextAppState => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.cleanupOverlays();
    }
  };

  handleDimensionsChange = () => {
    const {width, height} = Dimensions.get('screen');
    // PiP / tiny floating window — tear down overlays so a ghost Modal cannot cover PiP.
    if (width > 0 && height > 0 && (width < 300 || height < 300)) {
      this.cleanupOverlays();
    }
  };

  cleanupOverlays = () => {
    try {
      Popup.forceHide();
    } catch (_) {
      /* ignore */
    }
    try {
      ActionToast.clear();
    } catch (_) {
      /* ignore */
    }
    try {
      Toast.hide();
    } catch (_) {
      /* ignore */
    }
    try {
      SPSheet.hide();
    } catch (_) {
      /* ignore */
    }
    try {
      Drawer.hide();
    } catch (_) {
      /* ignore */
    }
    try {
      OverlayBus.hide();
    } catch (_) {
      /* ignore */
    }
  };

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
