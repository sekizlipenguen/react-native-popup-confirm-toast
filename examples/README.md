# ActionToast Playground

`ActionToastPlayground.js`, ActionToast public API'sini gerçek bir uygulama ekranında
gözle test etmek için hazırlanmış geliştirme ekranıdır.

Kapsam:

- 7 ekran konumu
- `stack` ve `queue`
- 5 giriş animasyonu
- Başarılı, hata, uyarı, bilgi ve yükleniyor tipleri
- CTA, kart tıklama, kalıcı kart ve aynı `id` ile güncelleme
- Eski `Toast.show` uyumluluk katmanı
- Otomatik görsel tur

## Kullanım

Uygulama kökünün paket `Root` bileşeniyle sarılı olması gerekir:

```jsx
import {Root as PopupRoot} from '@sekizlipenguen/react-native-popup-confirm-toast';

export default function App() {
  return (
    <PopupRoot>
      <NavigationContainer>{/* ... */}</NavigationContainer>
    </PopupRoot>
  );
}
```

Playground dosyasını uygulamanıza kopyalayın ve yalnızca geliştirme navigation
ağacına ekleyin:

```jsx
import ActionToastPlayground from './dev/ActionToastPlayground';

<Stack.Screen
  name="ActionToastPlayground"
  component={ActionToastPlayground}
/>
```

Bu klasör Git deposunda tutulur fakat `package.json > files` allowlist'inde
bulunmadığı için npm paketine dahil edilmez.
