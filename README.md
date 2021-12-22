# react-native-popup-confirm-toast

![platforms](https://img.shields.io/badge/platforms-Android%20%7C%20iOS-brightgreen.svg?style=flat-square&colorB=191A17)
[![npm](https://img.shields.io/npm/v/react-native-popup-confirm-toast.svg?style=flat-square)](https://www.npmjs.com/package/react-native-popup-confirm-toast)
[![npm](https://img.shields.io/npm/dm/react-native-popup-confirm-toast.svg?style=flat-square&colorB=007ec6)](https://www.npmjs.com/package/react-native-popup-confirm-toast)
<!-- [![github release](https://img.shields.io/github/release/sekizlipenguen/react-native-popup-confirm-toast.svg?style=flat-square)](https://github.com/sekizlipenguen/react-native-popup-confirm-toast/releases) -->
[![github issues](https://img.shields.io/github/issues/sekizlipenguen/react-native-popup-confirm-toast.svg?style=flat-square)](https://github.com/sekizlipenguen/react-native-popup-confirm-toast/issues)
[![github closed issues](https://img.shields.io/github/issues-closed/sekizlipenguen/react-native-popup-confirm-toast.svg?style=flat-square&colorB=44cc11)](https://github.com/sekizlipenguen/react-native-popup-confirm-toast/issues?q=is%3Aissue+is%3Aclosed)
[![Issue Stats](https://img.shields.io/issuestats/i/github/sekizlipenguen/react-native-popup-confirm-toast.svg?style=flat-square&colorB=44cc11)](http://github.com/sekizlipenguen/react-native-popup-confirm-toast/issues)

### Release notes(2.0.3)  🐧 🐐

- New feature(SPSheet) 🎉
- SPSheet timing parameters
- Popup Component (bounciness add)

## Example Bottom Sheet

|    Custom Example 1    |    Custom Example 2    |    Custom Example 3    |
|:----------------------:|:----------------------:|:----------------------:|
| ![](assets/popup6.gif) | ![](assets/popup5.gif) | ![](assets/popup7.gif) |

## Example Popup Message

|Example Message|Example Confirm Message| Example Message AutoClose |Example Custom Body Component |
| :-----------------------------------------------------------: | :-----------------------------------------------------------: | :-----------------------------------------------------------:| :-----------------------------------------------------------:|
| ![](assets/popup1.gif) | ![](assets/popup2.gif) | ![](assets/popup3.gif) | ![](assets/popup4.gif) |

## Example Toast Message

|                          Example Toast Top                    |                          Example Toast Bottom                 |
| :-----------------------------------------------------------: | :-----------------------------------------------------------: |
| ![](assets/3.gif) | ![](assets/4.gif) |

## Usage

## Installation

```
yarn add react-native-status-bar-height
or
npm install react-native-status-bar-height
```

```
yarn add react-native-popup-confirm-toast
or
npm install react-native-popup-confirm-toast
```

### Example Bottom Sheet

```
import { Root, SPSheet } from 'react-native-popup-confirm-toast'

const component = (props) => {
    //hook or class 
    return null;
    
    props.spSheet.hide();
};

<Root>
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
            <Text>Open Popup Message</Text>
        </TouchableOpacity>
    </View>
</Root>
```

### Example Message

```
import { Root, Popup } from 'react-native-popup-confirm-toast'
<Root>
    <View>
        <TouchableOpacity
            onPress={() =>
              Popup.show({
                type: 'success',
                title: 'Dikkat!',
                textBody: 'Mutlak özgürlük, kendi başına hiçbir anlam ifade etmez. ',
                buttonText: 'Tamam',
                callback: () => Popup.hide()
              })
            }
        >
            <Text>Open Popup Message</Text>
        </TouchableOpacity>
    </View>
</Root>
```

### Example Confirm Message

```
import { Root, Popup } from 'react-native-popup-confirm-toast'
<Root>
    <View>
        <TouchableOpacity
            onPress={() =>
              Popup.show({
                type: 'confirm',
                title: 'Dikkat!',
                textBody: 'Mutlak özgürlük, kendi başına hiçbir anlam ifade etmez. ',
                buttonText: 'Tamam',
                confirmText:'Vazgeç',
                callback: () => Popup.hide()
              })
            }
        >
            <Text>Open Popup Confirm Message</Text>
        </TouchableOpacity>
    </View>
</Root>
```

### Example Custom Body Component

```
import { Root, Popup } from 'react-native-popup-confirm-toast'
//hooks or class component
const bodyComponent = (props) => {

return null;
}

<Root>
    <View>
        <TouchableOpacity
            onPress={() =>
                const popup = Popup;
                popup.show({
                    type: 'confirm',
                    textBody: 'Hesabınızın silinme işlemini onaylamak için şifrenizi giriniz.',
                    bodyComponent: () => bodyComponent({...props,popup}),
                    confirmText: 'Vazgeç',
                    iconEnabled: false,
                    descTextStyle: GlobalAlertModalStyle.descTextStyle,
                    confirmButtonTextStyle: GlobalAlertModalStyle.confirmButtonTextStyle,
                    buttonEnabled: false,
                });
            }
        >
            <Text>Open Popup Confirm Message</Text>
        </TouchableOpacity>
    </View>
</Root>
```

### Toast

```
import { Root, Toast } from 'react-native-popup-confirm-toast'
    <Root>
        <View>
            <TouchableOpacity
                onPress={() => 
                      Toast.show({
                        title: 'Dikkat!',
                        text: 'Mutlak özgürlük, kendi başına hiçbir anlam ifade etmez.',
                        color: '#702c91',
                        timeColor: '#440f5f',
                        timing: 5000,
                        icon: <Icon name={'check'} color={'#fff'} size={31}/>,
                        position: 'bottom',
                    })
                }
            >
                <Text>Open Toast</Text>
            </TouchableOpacity>
        </View>
    </Root>
```

## Documentation

### SPSheet

|Key |Type |Description | Default |
|--- |--- |--- |--- |
|`background`|string| | rgba(0, 0, 0, 0.5)|
|`height`|number| auto height (min: 250) | 250|
|`duration`|number| animation time used when opening| 250(ms)|
|`closeDuration`|number| animation time used when closing | 300(ms)|
|`closeOnDragDown`|boolean| Use drag with motion to close the window | true|
|`closeOnPressMask`|boolean| press the outside space to close the window | true|
|`closeOnPressBack`|boolean| Press the back key to close the window (Android only) | true|
|`dragTopOnly`|boolean| use only the top area of the draggable icon to close the window | false|
|`component`|component(hook or class)| custom modal component container | null| 
|`onOpenComplete`|function| works after the window is opened| null|
|`onCloseComplete`|function| works after window is closed | null|
|`customStyles`|object| customStyles: { draggableIcon: {}, container: {}} | {}|
|`timing`|number| Use this parameter for automatic shutdown. | 0(ms)|

### Popup

| Key | Type | Description| Default |
|--- |--- |--- |--- |
|`title`|string| |false|
|`textBody`|string| |false| 
|`bodyComponent`|component(hook or class)| custom modal component container | null| 
|`type`|enum| enum(success, danger, warning, confirm) | warning|
|`buttonText`|string| |Ok|
|`confirmText`| string| |Cancel|
|`callback`| function| ok button press|popupHidden|
|`background`|string| |rgba(0, 0, 0, 0.5)
|`timing`|number| 0 > autoClose | 0 |
|`iconEnabled`|boolean| | true |
|`icon`|requireUrl|   | require('../assets/{type}.png') |
|`modalContainerStyle`|object| | { width: '90%',backgroundColor: '#fff', borderRadius: 8, alignItems: 'center', overflow: 'hidden', position: 'absolute'}} |
|`buttonContentStyle`|object| | {} |
|`okButtonStyle`|object| | {backgroundColor: '#702c91'} |
|`confirmButtonStyle`|object| | default  |
|`okButtonTextStyle`|object| | default  |
|`confirmButtonTextStyle`|object| |default  |
|`titleTextStyle`|object|  | default |
|`descTextStyle`|object|  |default |
|`bounciness`|number|  |15 |

### Toast

|Key |Type |Description | Default |
|--- |--- |--- |--- |
|`title`|string| | false|
|`text`|string|Description | false|
|`titleTextStyle`|object| | {color: '#fff',fontWeight: 'bold',fontSize: 16}|
|`descTextStyle`|object| | {marginTop: 5,fontSize: 13,color: '#fff', fontWeight: '400',}|
|`backgroundColor`| string| | #1da1f2|
|`timeColor`| string| time backgroundColor | #1c6896|
|`position`|enum| parameters => top, bottom| bottom |
|`icon`|component| (react-native-vector-icons or <Image/> component)| null |
|`timing`|number| | 5000 ms |

### Methods

|Component Name|Method Name |Example |Description |
|--- |--- |--- |--- |
|SPSheet|show| const spSheet = SPSheet; spSheet.show(config);| |
|SPSheet|hide| const spSheet = SPSheet; spSheet.hide();| |
|Popup|show| const popup = Popup; popup.show(config);| |
|Popup|hide| const popup = Popup; popup.hide();| |
|Toast|show| const toast = Toast; toast.show(config);| |
|Toast|hide| const toast = Toast; toast.hide();| |

## Author

SekizliPenguen, Inspired by "popup-ui"

## License

[MIT](./LICENSE)
