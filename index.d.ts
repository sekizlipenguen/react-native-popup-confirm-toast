declare module "@sekizlipenguen/react-native-popup-confirm-toast" {
    import {FC, ReactNode} from "react";
    import {LayoutChangeEvent, StyleProp, TextStyle, ViewStyle} from "react-native";

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

    export interface ActionToastActionConfig {
        node?: ReactNode;
        onPress?: () => void;
        backgroundColor?: string;
        accessibilityLabel?: string;
        closeAccessibilityLabel?: string;
        closeNode?: ReactNode;
    }

    export interface ActionToastConfig {
        message?: string;
        text?: string;
        duration?: number;
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

    export interface PopupConfig {
        title?: string;
        textBody?: string;
        type?: "success" | "info" | "danger" | "warning" | "confirm";
        buttonText?: string;
        cancelButtonText?: string;
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

    export interface SheetBodyProps {
        sheetHeight?: number;
        keyboardInset?: number;
        measuring?: boolean;
    }

    export interface SheetConfig {
        background?: string;
        height?: number;
        autoHeight?: boolean;
        maxHeight?: number;
        allowHeightShrink?: boolean;
        duration?: number;
        closeDuration?: number;
        closeOnDragDown?: boolean;
        closeOnPressMask?: boolean;
        closeOnPressBack?: boolean;
        dragTopOnly?: boolean;
        component?: FC<{ sheetProps?: SheetBodyProps }>;
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

    export interface DrawerConfig {
        position?: "left" | "right" | "top" | "bottom";
        drawerWidth?: number;
        drawerColor?: string;
        backgroundColor?: string;
        duration?: number;
        backdropPressToClose?: boolean;
        component?: FC<{ onClose: () => void }>;
        onOpen?: () => void;
        onOpenComplete?: () => void;
        onClose?: () => void;
        onCloseComplete?: () => void;
    }

    export interface Toast {
        show: (config: ToastConfig) => void;
        hide: () => void;
    }

    export interface ActionToast {
        show: (config: ActionToastConfig) => void;
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
        reportContentHeight: (height: number, onComplete?: () => void) => void;
    }

    export interface Drawer {
        show: (config: DrawerConfig) => void;
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
