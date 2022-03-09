import Root from './src/main/Root';
import Popup from './src/main/Popup';
import Toast from './src/main/Toast';
import SPSheet from './src/main/SPSheet';

declare module 'react-native-popup-confirm-toast' {
    // @ts-ignore
    export {
        Root,
        Popup,
        SPSheet,
        Toast,
    }
}
