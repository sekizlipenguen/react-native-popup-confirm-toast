declare module "@sekizlipenguen/react-native-popup-confirm-toast" {
    import {ComponentType, FC, ReactNode} from "react";
    import {LayoutChangeEvent, StyleProp, TextStyle, ViewStyle} from "react-native";

    export interface ToastConfig {
        title?: string;
        text?: string;
        titleTextStyle?: StyleProp<TextStyle>;
        descTextStyle?: StyleProp<TextStyle>;
        backgroundColor?: string;
        timeColor?: string;
        position?: "top" | "bottom";
        icon?: ComponentType<any> | ReactNode;
        timing?: number;
        type?: string;
        statusBarType?: "default" | "dark-content" | "light-content";
        statusBarTranslucent?: boolean;
        statusBarHidden?: boolean;
        statusBarAndroidHidden?: boolean;
        statusBarAppleHidden?: boolean;
        statusBarAnimation?: boolean;
        hiddenDuration?: number;
        startDuration?: number;
        onOpen?: () => void;
        onOpenComplete?: () => void;
        onClose?: () => void;
        onCloseComplete?: () => void;
    }

    export interface ActionToastActionConfig {
        node?: ReactNode;
        onPress?: () => void;
        backgroundColor?: string;
        accessibilityLabel?: string;
        closeAccessibilityLabel?: string;
        closeNode?: ReactNode;
    }

    export interface ActionToastConfig {
        /** Primary message text */
        message?: string;
        /** Alias of `message` */
        text?: string;
        /** Auto-hide duration in ms (default: 4000) */
        duration?: number;
        /** Distance from bottom safe area / screen edge (default: 16) */
        bottomOffset?: number;
        action?: ActionToastActionConfig | null;
        onClose?: () => void;
        styles?: {
            wrap?: StyleProp<ViewStyle>;
            bar?: StyleProp<ViewStyle>;
            actionButton?: StyleProp<ViewStyle>;
            message?: StyleProp<TextStyle>;
            closeButton?: StyleProp<ViewStyle>;
        };
    }

    export interface PopupBodyProps {
        popupProps?: any;
        onLayout?: (event: LayoutChangeEvent) => void;
    }

    export interface PopupConfig {
        title?: string;
        textBody?: string;
        type?: "success" | "info" | "danger" | "warning" | "confirm";
        buttonEnabled?: boolean;
        buttonText?: string;
        /** Alias of `confirmText` (cancel / secondary button label) */
        cancelButtonText?: string;
        confirmText?: string;
        cancelCallback?: () => void;
        callback?: () => void;
        iconEnabled?: boolean;
        icon?: ComponentType<any> | ReactNode | false;
        iconHeaderStyle?: StyleProp<ViewStyle>;
        containerStyle?: StyleProp<ViewStyle>;
        modalContainerStyle?: StyleProp<ViewStyle>;
        buttonContentStyle?: StyleProp<ViewStyle>;
        okButtonStyle?: StyleProp<ViewStyle>;
        confirmButtonStyle?: StyleProp<ViewStyle>;
        okButtonTextStyle?: StyleProp<TextStyle>;
        confirmButtonTextStyle?: StyleProp<TextStyle>;
        titleTextStyle?: StyleProp<TextStyle>;
        descTextStyle?: StyleProp<TextStyle>;
        background?: string;
        bodyComponent?: ComponentType<PopupBodyProps> | FC<PopupBodyProps>;
        bodyComponentForce?: boolean;
        timing?: number;
        duration?: number;
        closeDuration?: number;
        bounciness?: number;
        useNativeDriver?: boolean;
        onOpen?: () => void;
        onOpenComplete?: () => void;
        onClose?: () => void;
        onCloseComplete?: () => void;
    }

    /** Props passed to SPSheet `component` as `sheetProps` */
    export interface SheetBodyProps {
        sheetHeight?: number;
        keyboardInset?: number;
        measuring?: boolean;
    }

    export interface SheetComponentProps {
        sheetProps?: SheetBodyProps;
        [key: string]: any;
    }

    export interface SheetConfig {
        /** Dim / mask color (default: rgba(0,0,0,0.5)) */
        background?: string;
        /**
         * Fixed sheet height. If omitted or <= 0, `autoHeight` is used
         * (measure content, then open at measured size).
         */
        height?: number;
        /** Follow content height (default: true when `height` is not set) */
        autoHeight?: boolean;
        /** Cap measured / set height (default: ~92% of screen) */
        maxHeight?: number;
        /** Allow shrinking after open (default: true) */
        allowHeightShrink?: boolean;
        /** Open animation duration ms (default: 250) */
        duration?: number;
        /** Close animation duration ms (default: 300) */
        closeDuration?: number;
        /** Drag handle / body to dismiss (default: true) */
        closeOnDragDown?: boolean;
        /** Tap dim mask to dismiss (default: true) */
        closeOnPressMask?: boolean;
        /** Android back / Modal onRequestClose (default: true) */
        closeOnPressBack?: boolean;
        /** Only the drag handle captures pan (default: false) */
        dragTopOnly?: boolean;
        /** Sheet body component; receives `sheetProps` */
        component?: ComponentType<SheetComponentProps> | FC<SheetComponentProps>;
        onOpen?: () => void;
        onOpenComplete?: () => void;
        onClose?: () => void;
        onCloseComplete?: () => void;
        customStyles?: {
            draggableIcon?: StyleProp<ViewStyle>;
            container?: StyleProp<ViewStyle>;
            draggableContainer?: StyleProp<ViewStyle>;
        };
        /** @deprecated use `duration` */
        timing?: number;
        /** Lift sheet above keyboard (default: false) */
        keyboardHeightAdjustment?: boolean;
    }

    export interface DrawerConfig {
        position?: "left" | "right" | "top" | "bottom";
        drawerWidth?: number;
        drawerColor?: string;
        backgroundColor?: string;
        duration?: number;
        backdropPressToClose?: boolean;
        component?: ComponentType<{ onClose: () => void }> | FC<{ onClose: () => void }>;
        onOpen?: () => void;
        onOpenComplete?: () => void;
        onClose?: () => void;
        onCloseComplete?: () => void;
    }

    export interface Toast {
        show: (config?: ToastConfig) => void;
        hide: () => void;
    }

    export interface ActionToast {
        show: (config?: ActionToastConfig) => void;
        hide: () => void;
    }

    export interface Popup {
        show: (config?: PopupConfig) => void;
        hide: () => void;
    }

    export interface SPSheet {
        show: (config?: SheetConfig) => void;
        hide: () => void;
        setHeight: (height: number, onComplete?: () => void) => void;
        /** Alias of `setHeight` for content-driven sizing from sheet body */
        reportContentHeight: (height: number, onComplete?: () => void) => void;
    }

    export interface Drawer {
        show: (config?: DrawerConfig) => void;
        hide: () => void;
    }

    export interface RootProps {
        children?: ReactNode;
        style?: StyleProp<ViewStyle>;
    }

    export const Toast: Toast;
    export const ActionToast: ActionToast;
    export const Popup: Popup;
    export const SPSheet: SPSheet;
    export const Drawer: Drawer;
    export const Root: FC<RootProps>;
    export const getStatusBarHeight: () => number;
    export const isIPhoneWithMonobrow: () => boolean;
}
