declare module "react-native-popup-confirm-toast" {
    import {FC, ReactNode} from "react";
    import {LayoutChangeEvent, StyleProp, TextStyle, ViewStyle} from "react-native";

    // Toast Config
    export interface ToastConfig {
        title?: string;
        text?: string;
        titleTextStyle?: StyleProp<TextStyle>;
        descTextStyle?: StyleProp<TextStyle>;
        backgroundColor?: string;
        timeColor?: string;
        position?: "top" | "bottom";
        icon?: FC | ReactNode;
        timing?: number;
        statusBarType?: "default" | "dark-content" | "light-content";
        statusBarTranslucent?: boolean;
        statusBarHidden?: boolean;
        statusBarAndroidHidden?: boolean;
        statusBarAppleHidden?: boolean;
        hiddenDuration?: number;
        startDuration?: number;
        onOpen?: () => void;
        onOpenComplete?: () => void;
        onClose?: () => void;
        onCloseComplete?: () => void;
    }

    // Popup Config
    export interface PopupConfig {
        title?: string;
        textBody?: string;
        type?: "success" | "info" | "danger" | "warning" | "confirm";
        buttonText?: string;
        confirmText?: string;
        cancelCallback?: () => void;
        callback?: () => void;
        icon?: FC | ReactNode;
        iconHeaderStyle?: StyleProp<ViewStyle>;
        containerStyle?: StyleProp<ViewStyle>;
        modalContainerStyle?: StyleProp<ViewStyle>;
        background?: string;
        bodyComponent?: FC<{ popupProps: any; onLayout?: (event: LayoutChangeEvent) => void }>;
        bodyComponentForce?: boolean;
        timing?: number;
        onOpen?: () => void;
        onOpenComplete?: () => void;
        onClose?: () => void;
        onCloseComplete?: () => void;
    }

    // Sheet Config
    export interface SheetConfig {
        background?: string;
        height?: number;
        duration?: number;
        closeDuration?: number;
        closeOnDragDown?: boolean;
        closeOnPressMask?: boolean;
        closeOnPressBack?: boolean;
        dragTopOnly?: boolean;
        component?: FC<{ sheetProps: any }>;
        onOpen?: () => void;
        onOpenComplete?: () => void;
        onClose?: () => void;
        onCloseComplete?: () => void;
        customStyles?: {
            draggableIcon?: StyleProp<ViewStyle>;
            container?: StyleProp<ViewStyle>;
            draggableContainer?: StyleProp<ViewStyle>;
        };
        timing?: number;
        keyboardHeightAdjustment?: boolean;
    }

    export interface Toast {
        show: (config: ToastConfig) => void;
        hide: () => void;
    }

    export interface Popup {
        show: (config: PopupConfig) => void;
        hide: () => void;
    }

    export interface SPSheet {
        show: (config: SheetConfig) => void;
        hide: () => void;
        setHeight: (height: number, onComplete?: () => void) => void;
    }

    export const Toast: Toast;
    export const Popup: Popup;
    export const SPSheet: SPSheet;
    export const Root: FC<React.PropsWithChildren<{}>>;
    export const getStatusBarHeight: () => number;
    export const isIPhoneWithMonobrow: () => boolean;
}
