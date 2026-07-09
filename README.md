![platforms](https://img.shields.io/badge/platforms-Web%20%7C%20Android%20%7C%20iOS-brightgreen.svg?style=flat-square&colorB=191A17)
[![npm](https://img.shields.io/npm/v/@sekizlipenguen/react-native-popup-confirm-toast.svg?style=flat-square)](https://www.npmjs.com/package/@sekizlipenguen/react-native-popup-confirm-toast)
[![npm](https://img.shields.io/npm/dm/@sekizlipenguen/react-native-popup-confirm-toast.svg?style=flat-square&colorB=007ec6)](https://www.npmjs.com/package/@sekizlipenguen/react-native-popup-confirm-toast)
[![github issues](https://img.shields.io/github/issues/sekizlipenguen/react-native-popup-confirm-toast.svg?style=flat-square)](https://github.com/sekizlipenguen/react-native-popup-confirm-toast/issues)
[![github closed issues](https://img.shields.io/github/issues-closed/sekizlipenguen/react-native-popup-confirm-toast.svg?style=flat-square&colorB=44cc11)](https://github.com/sekizlipenguen/react-native-popup-confirm-toast/issues?q=is%3Aissue+is%3Aclosed)

# @sekizlipenguen/react-native-popup-confirm-toast

A flexible and user-friendly popup, toast, and bottom sheet solution for React Native. This package provides customizable components for displaying interactive messages, confirmation dialogs, and toast notifications in your mobile applications.

**Note:** This package has been moved to the `@sekizlipenguen` scope for improved organization and better support for future updates.

## Example Bottom Sheet

|    Custom Example 1    |    Custom Example 2    |    Custom Example 3    |    Custom Example 4    |
|:----------------------:|:----------------------:|:----------------------:|:----------------------:|
| ![](assets/popup6.gif) | ![](assets/popup5.gif) | ![](assets/popup7.gif) | ![](assets/popup8.gif) |

## Example Drawer

|       Drawer Left       |      Drawer Right       |       Drawer Top        |      Drawer Bottom      |
|:-----------------------:|:-----------------------:|:-----------------------:|:-----------------------:|
| ![](assets/drawer2.gif) | ![](assets/drawer1.gif) | ![](assets/drawer3.gif) | ![](assets/drawer4.gif) |

## Example Popup Message

|    Example Message     | Example Confirm Message | Example Message AutoClose | Example Custom Body Component |
|:----------------------:|:-----------------------:|:-------------------------:|:-----------------------------:|
| ![](assets/popup1.gif) | ![](assets/popup2.gif)  |  ![](assets/popup3.gif)   |    ![](assets/popup4.gif)     |

## Example Toast Message

| Example Toast Top | Example Toast Bottom |
|:-----------------:|:--------------------:|
| ![](assets/3.gif) |  ![](assets/4.gif)   |

## ActionToast (v2.0)

Floating bottom action bar for cart success, quick CTA and dismiss — ideal for e-commerce flows. **Mounted automatically in `Root`** — no extra setup.

```javascript
import { ActionToast } from '@sekizlipenguen/react-native-popup-confirm-toast';

ActionToast.show({
  message: 'Ürün sepete eklendi',
  duration: 4000,
  bottomOffset: 80, // tab bar height
  action: {
    node: <YourIcon size={20} color="#fff" />,
    backgroundColor: '#D6001F',
    onPress: () => navigation.navigate('Cart'),
    accessibilityLabel: 'Go to cart',
  },
});

ActionToast.hide();
```

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `message` / `text` | string | Toast message | `''` |
| `duration` | number | Auto-hide ms | `4000` |
| `bottomOffset` | number | Distance from bottom (tab bar) | `16` |
| `action` | object | `{ node, onPress, backgroundColor, accessibilityLabel }` | `null` |
| `onClose` | function | Fired when toast hides | `null` |
| `styles` | object | `{ wrap, bar, actionButton, message, closeButton }` | `{}` |

## SPSheet (v2.0)

Bottom sheet with **auto height**, **measure-before-open**, and **keyboard-aware** positioning.

### Quick start — fixed height

```javascript
SPSheet.show({
  height: 320,
  dragTopOnly: true,
  component: MySheetBody,
});
```

### Auto height (recommended for forms)

Content is measured **off-screen first**, then the sheet opens once at the correct height — no small-then-grow flicker.

```javascript
SPSheet.show({
  autoHeight: true,
  allowHeightShrink: true,
  keyboardHeightAdjustment: true,
  dragTopOnly: true,
  closeOnDragDown: true,
  component: ProductReviewSheetBody,
});
```

Inside the body component:

```javascript
function ProductReviewSheetBody({ sheetProps }) {
  const insets = useSafeAreaInsets();
  const sheetHeight = sheetProps?.sheetHeight || 0;
  const isMeasuring = sheetProps?.measuring === true;

  return (
    <ScrollView
      style={sheetHeight && !isMeasuring ? { maxHeight: sheetHeight - 17 } : undefined}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
    >
      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          // First layout: report immediately (no debounce) for measure-before-open
          SPSheet.reportContentHeight(h + 17 + insets.bottom);
        }}
      >
        {/* form content */}
      </View>
    </ScrollView>
  );
}
```

### SPSheet API highlights

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `height` | number | Fixed height (px). Ignored when `autoHeight: true` | min 100 |
| `autoHeight` | boolean | Content-driven height | `false` |
| `maxHeight` | number | Max sheet height | 92% of screen |
| `allowHeightShrink` | boolean | Allow height to decrease after open | `true` |
| `keyboardHeightAdjustment` | boolean | Lift sheet above keyboard (iOS + Android) | `false` |
| `dragTopOnly` | boolean | Drag handle only (not whole sheet) | `false` |
| `closeOnDragDown` | boolean | Swipe down to close | `true` |
| `closeOnPressMask` | boolean | Tap backdrop to close | `true` |
| `closeOnPressBack` | boolean | Android back to close | `true` |
| `component` | FC | Body component; receives `sheetProps` | `null` |
| `onOpen` / `onOpenComplete` / `onClose` / `onCloseComplete` | function | Lifecycle callbacks | — |

### Static methods

| Method | Description |
|--------|-------------|
| `SPSheet.show(config)` | Open sheet |
| `SPSheet.hide()` | Close sheet |
| `SPSheet.setHeight(height, onComplete?)` | Change height after open |
| `SPSheet.reportContentHeight(height, onComplete?)` | Same as `setHeight`; use from body `onLayout` |

### `sheetProps` passed to body

| Key | Type | Description |
|-----|------|-------------|
| `sheetHeight` | number | Current sheet height |
| `keyboardInset` | number | Active keyboard lift (px) |
| `measuring` | boolean | `true` during off-screen measure phase |

### Keyboard behaviour (iOS)

When `keyboardHeightAdjustment: true`:

1. Sheet moves up via `positionPopup` (not margin hacks).
2. White fill covers the rounded gap between sheet and keyboard top edge.
3. Combine with a bounded `ScrollView` + scroll-to-focused-field in your body for best UX.

---

Using npm:

```bash
npm install @sekizlipenguen/react-native-popup-confirm-toast
```

Using yarn:

```bash
yarn add @sekizlipenguen/react-native-popup-confirm-toast
```

## Usage

Wrap your root component in Provider from @sekizlipenguen/react-native-popup-confirm-toast. If you have a vanilla React Native project,
it's a good idea to add it in the component which is passed to AppRegistry.registerComponent. This will usually be in
the index.js file. If you have an Expo project, you can do this inside the exported component in the App.js file.

### Example Provider

```javascript
import * as React from 'react';
import { AppRegistry } from 'react-native';
import {Root as PopupRootProvider} from '@sekizlipenguen/react-native-popup-confirm-toast';
import { name as appName } from './app.json';
import App from './src/App';

export default function Main() {
  return (
    <PopupRootProvider>
      <App />
    </PopupRootProvider>
  );
}

AppRegistry.registerComponent(appName, () => Main);
```

### Example Bottom Sheet

```javascript
import { Root, SPSheet } from '@sekizlipenguen/react-native-popup-confirm-toast'

const component = (props) => {
    //hook or class 
    return (<Text>Hi, SekizliPenguen</Text>);
    
    //props.spSheet.hide();
    //props.spSheet.setHeight(150,()=>alert('nice'));
};

<View>
    <TouchableOpacity
        onPress={() => {
            const spSheet = SPSheet;
            spSheet.show({
                component: () => component({...this.props, spSheet}),
                dragFromTopOnly: true,
                onCloseComplete: () => {
                    alert('onCloseComplete');
                },
                onOpenComplete: () => {
                    alert('onOpenComplete');
                },
                height:260
            });
        }
    >
        <Text>Open SPSheet Message</Text>
    </TouchableOpacity>
</View>
```

### Example Message

```javascript
import {Popup} from '@sekizlipenguen/react-native-popup-confirm-toast'
<View>
    <TouchableOpacity
        onPress={() =>
          Popup.show({
            type: 'success',
            title: 'Success!',
            textBody: 'Mutlak özgürlük, kendi başına hiçbir anlam ifade etmez. ',
            buttonText: 'OK',
            callback: () => Popup.hide()
          })
        }
    >
        <Text>Open Popup Message</Text>
    </TouchableOpacity>
</View>
```

### Example Confirm Message

```javascript
import {Popup} from '@sekizlipenguen/react-native-popup-confirm-toast'
<View>
    <TouchableOpacity
        onPress={() =>
            Popup.show({
                type: 'confirm',
                title: 'Dikkat!',
                textBody: 'Mutlak özgürlük, kendi başına hiçbir anlam ifade etmez. ',
                buttonText: 'Tamam',
                confirmText: 'Vazgeç',
                callback: () => {
                    alert('Okey Callback && hidden');
                    Popup.hide();
                },
                cancelCallback: () => {
                    alert('Cancel Callback && hidden');
                    Popup.hide();
                },
            })
        }
    >
        <Text>Open Popup Confirm Message</Text>
    </TouchableOpacity>
</View>
```

### Example Custom Body Component

```javascript
import { Root, Popup } from '@sekizlipenguen/react-native-popup-confirm-toast'
//hooks or class component
const bodyComponent = ({props,bodyProps}) => {
    return (
        <View onLayout={(e}=>bodyProps.onLayout(e)}>
        <Text>Mustafa Kemal ATATÜRK</Text>
        </View>
    );
}

<Root>
    <View>
        <TouchableOpacity
            onPress={() => {
                const popup = Popup;
                popup.show({
                    type: 'confirm',
                    textBody: 'Hesabınızın silinme işlemini onaylamak için şifrenizi giriniz.',
                    bodyComponent: (bodyProps) => bodyComponent({...props,bodyProps,popup}),
                    confirmText: 'Cancel',
                    iconEnabled: false,
                    buttonEnabled: false,
                });
            }}
        >
            <Text>Open Popup Confirm Message</Text>
        </TouchableOpacity>
    </View>
</Root>
```

### Toast

```javascript
import { Root, Toast } from '@sekizlipenguen/react-native-popup-confirm-toast'
    <Root>
        <View>
            <TouchableOpacity
onPress = {()
=>
                      Toast.show({
                          title: 'I\'m Eight!',
                          text: 'The best gift I received in this life are the codes. They are worlds inside the worlds.',
                          backgroundColor: '#702c91',
                          timeColor: '#440f5f',
                          timing: 3000,
                          icon: <Icon name={'check'} color={'#fff'} size={31}/>,
                          position: 'bottom',
                          statusBarType:'dark-content',
                          onCloseComplete: () => {
                            alert('onCloseComplete');
                          },
                          onOpenComplete: () => {
                            alert('onOpenComplete');
                          },
                        })
                }
            >
                <Text>Open Bottom Toast</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() =>
                    Toast.show({
                      title: 'I\'m Eight!',
                      text: 'The best gift I received in this life are the codes. They are worlds inside the worlds.',
                      backgroundColor: '#702c91',
                      timeColor: '#440f5f',
                      timing: 3000,
                      icon: <Icon name={'check'} color={'#fff'} size={31}/>,
                      position: 'top',
                      statusBarTranslucent: false,
                      statusBarType:'light-content',
                      onCloseComplete: () => {
                        alert('onCloseComplete');
                      },
                      onOpenComplete: () => {
                        alert('onOpenComplete');
                      },
                    })
                }
            >
                <Text>Open Top Toast</Text>
            </TouchableOpacity>

        </View>
    </Root>
```

### Drawer

```javascript
import {Root, Drawer} from '@sekizlipenguen/react-native-popup-confirm-toast'

const DrawerContent = ({onClose}) => {
  return (
      <View style={{flex: 1, padding: 20}}>
        <Text>Custom Drawer Content</Text>
        <TouchableOpacity onPress={onClose}>
          <Text>Close Drawer</Text>
        </TouchableOpacity>
      </View>
  );
};

<Root>
  <View>
    <TouchableOpacity
        onPress={() => {
          Drawer.show({
            component: DrawerContent,
            position: 'left',
            drawerWidth: 300,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            drawerColor: '#ffffff',
            duration: 300,
            backdropPressToClose: true,
            onOpenComplete: () => {
              console.log('Drawer opened');
            },
            onCloseComplete: () => {
              console.log('Drawer closed');
            },
          });
        }}
    >
      <Text>Open Left Drawer</Text>
    </TouchableOpacity>

    <TouchableOpacity
        onPress={() => {
          Drawer.show({
            component: DrawerContent,
            position: 'right',
            drawerWidth: 280,
          });
        }}
    >
      <Text>Open Right Drawer</Text>
    </TouchableOpacity>

    <TouchableOpacity
        onPress={() => {
          Drawer.show({
            component: DrawerContent,
            position: 'top',
            drawerWidth: 200,
          });
        }}
    >
      <Text>Open Top Drawer</Text>
    </TouchableOpacity>

    <TouchableOpacity
        onPress={() => {
          Drawer.show({
            component: DrawerContent,
            position: 'bottom',
            drawerWidth: 250,
          });
        }}
    >
      <Text>Open Bottom Drawer</Text>
    </TouchableOpacity>
  </View>
</Root>
```

## Features & Documentation

### SPSheet

| Key                        | Type                     | Description                                                               | Default            |
|----------------------------|--------------------------|---------------------------------------------------------------------------|--------------------|
| `background`               | string                   |                                                                           | rgba(0, 0, 0, 0.5) |
| `height`                   | number                   | auto height (min: 250)                                                    | 250                |
| `duration`                 | number                   | animation time used when opening                                          | 250(ms)            |
| `closeDuration`            | number                   | animation time used when closing                                          | 300(ms)            |
| `closeOnDragDown`          | boolean                  | Use drag with motion to close the window                                  | true               |
| `closeOnPressMask`         | boolean                  | press the outside space to close the window                               | true               |
| `closeOnPressBack`         | boolean                  | Press the back key to close the window (Android only)                     | true               |
| `dragTopOnly`              | boolean                  | use only the top area of the draggable icon to close the window           | false              |
| `component`                | component(hook or class) | custom modal component container                                          | null               | 
| `onOpen`                   | function                 | works after the window is opened                                          | null               |
| `onOpenComplete`           | function                 | works after the window is opened                                          | null               |
| `onClose`                  | function                 | works after window is closed                                              | null               |
| `onCloseComplete`          | function                 | works after window is closed                                              | null               |
| `customStyles`             | object                   | customStyles: { draggableIcon: {}, container: {}, draggableContainer:{} } | {}                 |
| `timing`                   | number                   | Use this parameter for automatic shutdown.                                | 0(ms)              |
| `keyboardHeightAdjustment` | boolean                  | Lift sheet above keyboard; iOS gap fill                                   | false              |
| `autoHeight`               | boolean                  | Content-driven height; measure-before-open                                | false              |
| `maxHeight`                | number                   | Maximum sheet height (px)                                                 | 92% of screen      |
| `allowHeightShrink`        | boolean                  | Allow height to decrease after open                                       | true               |

### Popup

| Key                      | Type                               | Description                                                                                        | Default                                                                                                                   |
|--------------------------|------------------------------------|----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| `title`                  | string                             |                                                                                                    | false                                                                                                                     |
| `textBody`               | string                             |                                                                                                    | false                                                                                                                     | 
| `bodyComponent`          | component(hook or class)           | custom modal component container                                                                   | null                                                                                                                      | 
| `bodyComponentForce`     | boolean                            | The component you specify covers the entire space                                                  | false                                                                                                                     | 
| `onLayout`               | (event: LayoutChangeEvent) => void | Triggers automatically to calculate and adjust the height of the popup component during rendering. | -                                                                                                                         |
| `type`                   | enum                               | enum(success, info, danger, warning, confirm)                                                      | warning                                                                                                                   |
| `buttonText`             | string                             |                                                                                                    | Ok                                                                                                                        |
| `confirmText`            | string                             |                                                                                                    | Cancel                                                                                                                    |
| `callback`               | function                           | ok button press                                                                                    | popupHidden                                                                                                               |
| `cancelCallback`         | function                           | cancel button press                                                                                | popupHidden                                                                                                               |
| `background`             | string                             |                                                                                                    | rgba(0, 0, 0, 0.5)                                                                                                        |
| `timing`                 | number                             | 0 > autoClose                                                                                      | 0                                                                                                                         |
| `iconEnabled`            | boolean                            |                                                                                                    | true <br/>                                                                                                                |
| `iconHeaderStyle`        | object                             |                                                                                                    | {height: 75, width: 100, backgroundColor: '#fff'}                                                                         |
| `icon`                   | requireUrl                         |                                                                                                    | require('../assets/{type}.png')                                                                                           |
| `containerStyle`         | object                             |                                                                                                    | { position: 'absolute', zIndex: 10, backgroundColor: 'rgba(0, 0, 0, 0.5)', alignItems: 'center', top: 0, left: 0,}        |
| `modalContainerStyle`    | object                             |                                                                                                    | { width: '90%',backgroundColor: '#fff', borderRadius: 8, alignItems: 'center', overflow: 'hidden', position: 'absolute'}} |
| `buttonContentStyle`     | object                             |                                                                                                    | {}                                                                                                                        |
| `okButtonStyle`          | object                             |                                                                                                    | {backgroundColor: '#702c91'}                                                                                              |
| `confirmButtonStyle`     | object                             |                                                                                                    | default                                                                                                                   |
| `okButtonTextStyle`      | object                             |                                                                                                    | default                                                                                                                   |
| `confirmButtonTextStyle` | object                             |                                                                                                    | default                                                                                                                   |
| `titleTextStyle`         | object                             |                                                                                                    | default                                                                                                                   |
| `descTextStyle`          | object                             |                                                                                                    | default                                                                                                                   |
| `bounciness`             | number                             |                                                                                                    | 15                                                                                                                        |
| `onClose`                | function                           | when the popup is first closed                                                                     | false                                                                                                                     |
| `onCloseComplete`        | function                           |                                                                                                    | false                                                                                                                     |
| `onOpen`                 | function                           | when the popup is first opened                                                                     | false                                                                                                                     |
| `onOpenComplete`         | function                           |                                                                                                    | false                                                                                                                     |
| `duration`               | boolean                            |                                                                                                    | 100                                                                                                                       |
| `closeDuration`          | boolean                            |                                                                                                    | 100                                                                                                                       |

### Toast

| Key                      | Type      | Description                                       | Default                                                       |
|--------------------------|-----------|---------------------------------------------------|---------------------------------------------------------------|
| `title`                  | string    |                                                   | false                                                         |
| `text`                   | string    | Description                                       | false                                                         |
| `titleTextStyle`         | object    |                                                   | {color: '#fff',fontWeight: 'bold',fontSize: 16}               |
| `descTextStyle`          | object    |                                                   | {marginTop: 5,fontSize: 13,color: '#fff', fontWeight: '400',} |
| `backgroundColor`        | string    |                                                   | #1da1f2                                                       |
| `timeColor`              | string    | time backgroundColor                              | #1c6896                                                       |
| `position`               | enum      | parameters => top, bottom                         | bottom                                                        |
| `icon`                   | component | (react-native-vector-icons or <Image/> component) | null                                                          |
| `timing`                 | number    |                                                   | 5000 ms                                                       |
| `statusBarType`          | string    |                                                   | default                                                       |
| `statusBarTranslucent`   | boolean   |                                                   | false                                                         |
| `statusBarHidden`        | boolean   |                                                   | false                                                         |
| `statusBarAndroidHidden` | boolean   |                                                   | true                                                          |
| `statusBarAppleHidden`   | boolean   |                                                   | false                                                         |
| `hiddenDuration`         | number    |                                                   | 200 ms                                                        |
| `startDuration`          | number    |                                                   | 200 ms                                                        |
| `onOpen`                 | function  | works after the window is opened                  | null                                                          |
| `onOpenComplete`         | function  | works after the window is opened                  | null                                                          |
| `onClose`                | function  | works after window is closed                      | null                                                          |
| `onCloseComplete`        | function  | works after window is closed                      | null                                                          |

### Drawer

| Key                    | Type                     | Description                                        | Default            |
|------------------------|--------------------------|----------------------------------------------------|--------------------|
| `component`            | component(hook or class) | custom drawer component (receives onClose as prop) | null               |
| `position`             | enum                     | enum(left, right, top, bottom)                     | left               |
| `drawerWidth`          | number                   | width or height of drawer depending on position    | 80% of screen      |
| `backgroundColor`      | string                   | backdrop background color                          | rgba(0, 0, 0, 0.5) |
| `drawerColor`          | string                   | drawer background color                            | #ffffff            |
| `duration`             | number                   | animation duration in milliseconds                 | 300(ms)            |
| `backdropPressToClose` | boolean                  | close drawer when pressing backdrop                | true               |
| `onOpen`               | function                 | works when the drawer starts opening               | null               |
| `onOpenComplete`       | function                 | works after the drawer is fully opened             | null               |
| `onClose`              | function                 | works when the drawer starts closing               | null               |
| `onCloseComplete`      | function                 | works after the drawer is fully closed             | null               |

### Methods

| Component Name | Method Name | Example                                                                | Description                         |
|----------------|-------------|------------------------------------------------------------------------|-------------------------------------|
| SPSheet        | show        | const spSheet = SPSheet; spSheet.show(config);                         |                                     |
| SPSheet        | hide        | const spSheet = SPSheet; spSheet.hide();                               |                                     |
| SPSheet        | setHeight   | SPSheet.setHeight(500, onComplete)                                     | Change height after open            |
| SPSheet        | reportContentHeight | SPSheet.reportContentHeight(500, onComplete)                   | Same as setHeight; use from body    |
| ActionToast    | show        | ActionToast.show(config)                                               | Show bottom action toast            |
| ActionToast    | hide        | ActionToast.hide()                                                     | Hide action toast                   |
| Popup          | show        | const popup = Popup; popup.show(config);                               |                                     |
| Popup          | hide        | const popup = Popup; popup.hide();                                     |                                     |
| Toast          | show        | const toast = Toast; toast.show(config);                               |                                     |
| Toast          | hide        | const toast = Toast; toast.hide();                                     |                                     |
| Drawer         | show        | const drawer = Drawer; drawer.show(config);                            |                                     |
| Drawer         | hide        | const drawer = Drawer; drawer.hide();                                  |                                     |

### Helper Function

```javascript
import {getStatusBarHeight} from '@sekizlipenguen/react-native-popup-confirm-toast';
```

## Author

SekizliPenguen

## License

[MIT](./LICENSE)
