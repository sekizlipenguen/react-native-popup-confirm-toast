import React, {Component} from 'react';

import {AppState, Dimensions} from 'react-native';
import PropTypes from 'prop-types';
import Popup from './Popup';
import Toast from './Toast';
import SPSheet from './SPSheet';

class Root extends Component {
  constructor(props) {
    super(props);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
    this.handleDimensionsChange = this.handleDimensionsChange.bind(this);
  }

  componentDidMount() {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    this.dimensionsSubscription = Dimensions.addEventListener('change', this.handleDimensionsChange);
  }

  componentWillUnmount() {
    this.appStateSubscription?.remove();
    this.dimensionsSubscription?.remove();
  }

  handleAppStateChange(nextAppState) {
    // Uygulama arka plana gittiğinde veya PIP moduna geçtiğinde
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.cleanupAllPopups();
    }
  }

  handleDimensionsChange() {
    // Ekran boyutu değiştiğinde
    const {width, height} = Dimensions.get('screen');
    // Ekran küçüldüyse, PIP moduna geçilmiş olabilir
    if (width < 300 || height < 300) {
      this.cleanupAllPopups();
    }
  }

  cleanupAllPopups() {
    // Tüm açık popupları, toastları ve sheetleri kapat
    if (Popup.popupInstance) {
      Popup.hide();
    }
    if (Toast.toastInstance) {
      Toast.hide();
    }
    if (SPSheet.spsheetInstance) {
      SPSheet.hide();
    }
  }

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
  style: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.number,
    PropTypes.array,
  ]),
}

export default Root

