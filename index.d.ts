import {ComponentType, FC, ReactNode} from "react";
import {LayoutChangeEvent, StyleProp, TextStyle, ViewStyle} from "react-native";

    export type ToastPosition =
        | "top"
        | "bottom"
        | "center"
        | "topLeft"
        | "topRight"
        | "bottomLeft"
        | "bottomRight";

    export type ToastAnimation = "slide" | "fade" | "fadeSlide" | "spring" | "none";
    export type ToastMode = "stack" | "queue";
    export type ToastType = "success" | "error" | "danger" | "warning" | "info" | "loading" | string;

    /**
     * Legacy banner Toast config. UI removed in v2.2 — mapped to ActionToast.
     * `timeColor` / statusBar* are ignored.
     */
    export interface ToastConfig {
        title?: string;
        text?: string;
        message?: string;
        titleTextStyle?: StyleProp<TextStyle>;
        descTextStyle?: StyleProp<TextStyle>;
        backgroundColor?: string;
        /** @deprecated ignored — banner progress removed */
        timeColor?: string;
        position?: "top" | "bottom";
        icon?: ComponentType<any> | ReactNode;
        timing?: number;
        duration?: number;
        type?: string;
        id?: string | number;
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
        id?: string | number;
        title?: string;
        /** Primary message text */
        message?: string;
        /** Alias of `message` */
        text?: string;
        type?: ToastType;
        icon?: ComponentType<any> | ReactNode | string | null | false;
        backgroundColor?: string;
        textColor?: string;
        iconColor?: string;
        /** Auto-hide duration in ms; `0` = persistent (default: 4000) */
        duration?: number | false;
        position?: ToastPosition;
        animation?: ToastAnimation;
        /** `stack` = up to maxVisible; `queue` = one at a time */
        mode?: ToastMode;
        maxVisible?: number;
        /** Edge inset (aliases `bottomOffset`) */
        offset?: number;
        /** Distance from bottom / used as offset (default: 16) */
        bottomOffset?: number;
        onPress?: () => void;
        /** Dismiss after card `onPress` (default: true when onPress set) */
        pressDismiss?: boolean;
        action?: ActionToastActionConfig | null;
        closeable?: boolean;
        onClose?: () => void;
        onCloseComplete?: () => void;
        onOpen?: () => void;
        onOpenComplete?: () => void;
        styles?: {
            wrap?: StyleProp<ViewStyle>;
            bar?: StyleProp<ViewStyle>;
            actionButton?: StyleProp<ViewStyle>;
            message?: StyleProp<TextStyle>;
            title?: StyleProp<TextStyle>;
            icon?: StyleProp<ViewStyle>;
            closeButton?: StyleProp<ViewStyle>;
        };
    }

    export interface ActionToastDefaults {
        position?: ToastPosition;
        animation?: ToastAnimation;
        mode?: ToastMode;
        maxVisible?: number;
        offset?: number;
        bottomOffset?: number;
        type?: ToastType;
        duration?: number | false;
    }

    export interface PopupBodyProps {
        popupProps?: any;
        onLayout?: (event: LayoutChangeEvent) => void;
    }

    export interface MaskConfig {
        /** Mask color (#RGB / #RRGGBB / rgb / rgba) */
        color?: string;
        /** Opacity 0–1 applied on top of color */
        opacity?: number;
    }

    export interface PopupAnimationConfig {
        type?: 'slide' | 'fade' | 'fadeSlide' | 'spring' | 'none';
        from?: 'bottom' | 'top' | 'left' | 'right' | 'center';
        duration?: number;
        closeDuration?: number;
        bounciness?: number;
        speed?: number;
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
        /**
         * Static mask color (Fabric-safe). Also accepts rgba.
         * Prefer `maskColor` / `maskOpacity` / `mask` for finer control.
         */
        background?: string;
        /** Mask color override */
        maskColor?: string;
        /** Mask opacity 0–1 (applied to maskColor/background) */
        maskOpacity?: number;
        /** Alias of maskOpacity */
        opacity?: number;
        /** Nested mask: `{ color, opacity }` */
        mask?: MaskConfig;
        /** Tap mask to close (default: true) */
        closeOnPressMask?: boolean;
        bodyComponent?: ComponentType<PopupBodyProps> | FC<PopupBodyProps>;
        bodyComponentForce?: boolean;
        timing?: number;
        /** Card open duration ms (default: 260) */
        duration?: number;
        /** Card close duration ms (default: 200) */
        closeDuration?: number;
        /**
         * Card animation: `slide` | `fade` | `fadeSlide` | `spring` | `none`
         * Default: `fadeSlide`
         */
        animation?: 'slide' | 'fade' | 'fadeSlide' | 'spring' | 'none';
        /**
         * Card entry direction: `bottom` | `top` | `left` | `right` | `center`
         * Default: `center`
         */
        from?: 'bottom' | 'top' | 'left' | 'right' | 'center';
        /** Detailed card animation override */
        popupAnimation?: PopupAnimationConfig;
        bounciness?: number;
        speed?: number;
        useNativeDriver?: boolean;
        onOpen?: () => void;
        onOpenComplete?: () => void;
        onClose?: () => void;
        onCloseComplete?: () => void;
        /**
         * Stacking order when shown above an open SPSheet.
         * Default: 100 (SPSheet default is 10). Higher covers lower.
         */
        zIndex?: number;
    }

    /** Props passed to SPSheet `component` as `sheetProps` */
    export interface SheetBodyProps {
        sheetHeight?: number;
        keyboardInset?: number;
        measuring?: boolean;
        /** Android/iOS system nav / home-indicator inset applied by SPSheet */
        bottomInset?: number;
        animation?: SheetAnimationConfig;
        from?: 'bottom' | 'top' | 'left' | 'right' | 'center';
    }

    export interface SheetComponentProps {
        sheetProps?: SheetBodyProps;
        [key: string]: any;
    }

    export interface SheetAnimationConfig {
        /** Sheet motion type */
        type?: 'slide' | 'fade' | 'fadeSlide' | 'spring' | 'none';
        /** Entry direction for slide/spring/fadeSlide */
        from?: 'bottom' | 'top' | 'left' | 'right' | 'center';
        duration?: number;
        closeDuration?: number;
        bounciness?: number;
        speed?: number;
    }

    export interface BackdropAnimationConfig {
        type?: 'fade' | 'none';
        duration?: number;
        closeDuration?: number;
    }

    export interface SheetConfig {
        /** Dim / mask color (default: rgba(0,0,0,0.5)) */
        background?: string;
        /** Mask color override */
        maskColor?: string;
        /** Mask opacity 0–1 */
        maskOpacity?: number;
        /** Alias of maskOpacity */
        opacity?: number;
        /** Nested mask: `{ color, opacity }` */
        mask?: MaskConfig;
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
        /** Open animation duration ms (default: 280) */
        duration?: number;
        /** Close animation duration ms (default: 240) */
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
            backdrop?: StyleProp<ViewStyle>;
            overlay?: StyleProp<ViewStyle>;
            handle?: StyleProp<ViewStyle>;
        };
        /** @deprecated use `duration` */
        timing?: number;
        /** Lift sheet above keyboard (default: false) */
        keyboardHeightAdjustment?: boolean;
        /**
         * Stacking order inside the shared Modal host.
         * Default: 10. Popup defaults to 100 so alerts cover the sheet.
         */
        zIndex?: number;
        /**
         * Sheet animation preset.
         * `slide` | `fade` | `fadeSlide` | `spring` | `none`
         * Default: `slide`
         */
        animation?: 'slide' | 'fade' | 'fadeSlide' | 'spring' | 'none';
        /**
         * Entry edge / origin.
         * `bottom` | `top` | `left` | `right` | `center`
         * Default: `bottom`
         */
        from?: 'bottom' | 'top' | 'left' | 'right' | 'center';
        /** Backdrop dim animation: `fade` | `none` | BackdropAnimationConfig */
        backdropAnimation?: 'fade' | 'none' | BackdropAnimationConfig;
        /** Detailed sheet animation override (wins over `animation` / `from`) */
        sheetAnimation?: SheetAnimationConfig;
        /** Spring bounciness when animation=`spring` */
        bounciness?: number;
        /** Spring speed when animation=`spring` */
        speed?: number;
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
        /** @deprecated Prefer ActionToast.show — redirected to ActionToast card stack */
        show: (config?: ToastConfig) => string | undefined;
        hide: () => void;
    }

    export interface ActionToast {
        /** Shows a toast and returns its generated/provided id when Root is mounted. */
        show: (config?: ActionToastConfig) => string | undefined;
        /** Hide by id, or the newest toast when id omitted */
        hide: (id?: string | number) => void;
        clear: () => void;
        setDefaults: (defaults?: ActionToastDefaults) => void;
    }

    export interface Popup {
        show: (config?: PopupConfig) => void;
        hide: () => void;
        POPUP_ANIMATIONS?: {
            slide: 'slide';
            fade: 'fade';
            fadeSlide: 'fadeSlide';
            spring: 'spring';
            none: 'none';
        };
        POPUP_FROM?: {
            bottom: 'bottom';
            top: 'top';
            left: 'left';
            right: 'right';
            center: 'center';
        };
    }

    export interface SPSheet {
        show: (config?: SheetConfig) => void;
        hide: () => void;
        setHeight: (height: number, onComplete?: () => void) => void;
        /** Alias of `setHeight` for content-driven sizing from sheet body */
        reportContentHeight: (height: number, onComplete?: () => void) => void;
        /** Whether the sheet Modal is currently open */
        isOpen?: () => boolean;
        SHEET_ANIMATIONS?: {
            slide: 'slide';
            fade: 'fade';
            fadeSlide: 'fadeSlide';
            spring: 'spring';
            none: 'none';
        };
        SHEET_FROM?: {
            bottom: 'bottom';
            top: 'top';
            left: 'left';
            right: 'right';
            center: 'center';
        };
        BACKDROP_ANIMATIONS?: {
            fade: 'fade';
            none: 'none';
        };
        LAYER_Z?: { sheet: number; popup: number };
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
    /** Default layer zIndex values: { sheet: 10, popup: 100 } */
    export const LAYER_Z: { sheet: number; popup: number };
    export const SHEET_ANIMATIONS: {
        slide: 'slide';
        fade: 'fade';
        fadeSlide: 'fadeSlide';
        spring: 'spring';
        none: 'none';
    };
    export const SHEET_FROM: {
        bottom: 'bottom';
        top: 'top';
        left: 'left';
        right: 'right';
        center: 'center';
    };
    export const BACKDROP_ANIMATIONS: {
        fade: 'fade';
        none: 'none';
    };
    export const POPUP_ANIMATIONS: {
        slide: 'slide';
        fade: 'fade';
        fadeSlide: 'fadeSlide';
        spring: 'spring';
        none: 'none';
    };
    export const POPUP_FROM: {
        bottom: 'bottom';
        top: 'top';
        left: 'left';
        right: 'right';
        center: 'center';
    };
    export const TOAST_POSITIONS: {
        top: 'top';
        bottom: 'bottom';
        center: 'center';
        topLeft: 'topLeft';
        topRight: 'topRight';
        bottomLeft: 'bottomLeft';
        bottomRight: 'bottomRight';
    };
    export const TOAST_ANIMATIONS: {
        slide: 'slide';
        fade: 'fade';
        fadeSlide: 'fadeSlide';
        spring: 'spring';
        none: 'none';
    };
    export const TOAST_MODES: {
        stack: 'stack';
        queue: 'queue';
    };
