declare module "react-native-popup-confirm-toast" {
  import { FC } from "react"
  import { StyleProp, TextStyle, ViewStyle } from "react-native"
  import { IconProps } from "react-native-vector-icons/Icon"
  export interface Config {
    title?: string
    text?: string
    titleTextStyle?: StyleProp<TextStyle>
    descTextStyle?: StyleProp<TextStyle>
    backgroundColor?: string
    timeColor?: string
    position?: "top" | "bottom"
    icon?: FC<IconProps>
    timing?: number
    statusBarType?: "default" | "dark-content" | "light-content"
    statusBarTranslucent?: boolean
    statusBarHidden?: boolean
    statusBarAndroidHidden?: boolean
    statusBarAppleHidden?: boolean
    hiddenDuration?: number
    startDuration?: number
    onOpen?: () => void
    onOpenComplete?: () => void
    onClose?: () => void
    onCloseComplete?: () => void
  }

  export interface SheetConfig {
    background?: string
    height?: number
    duration?: number
    closeDuration?: number
    closeOnDragDown?: boolean
    closeOnPressMask?: boolean
    closeOnPressBack?: boolean
    dragTopOnly?: boolean
    component?: FC
    onOpen?: () => void
    onOpenComplete?: () => void
    onClose?: () => void
    onCloseComplete?: () => void
    customStyles?: StyleProp<ViewStyle>
    timing?: number
    keyboardHeightAdjustment?: boolean
  }
  export interface Toast {
    show: (props: Config) => void
    hide: () => void
  }
  export interface Popup {
    show: (props: Config) => void
    hide: () => void
  }

  export interface SPSheet {
    show: (props: Config) => void
    setHeight: (height: number, onOpenComplete: () => void) => void
    hide: () => void
  }

  export const Toast: Toast
  export const Popup: Popup
  export const SPSheet: SPSheet
}
