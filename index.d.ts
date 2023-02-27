import Root from './src/main/Root';
import Popup from './src/main/Popup';
import Toast from './src/main/Toast';
import SPSheet from './src/main/SPSheet';
import {getStatusBarHeight} from './src/main/Helper';

declare module 'react-native-popup-confirm-toast' {
    // @ts-ignore
    export {
        Root,
        Popup,
        SPSheet,
        Toast,
        getStatusBarHeight
    }
}
