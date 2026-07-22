## [2.2.4] - 2026-07-22

### Fixed

- **Android ActionToast blocks scroll** — Bottom/stack toasts no longer use a full-screen `Modal` (Dialog), which locked touches behind the toast until dismiss. Bottom toasts use a pass-through absolute overlay; top toasts still use `Modal` so they stay above native headers.

---

## [2.2.3] - 2026-07-17

### Added

- **ActionToast `messageNumberOfLines`** — default remains `3` (short toast UX). Pass `0` or `false` for unlimited lines (no ellipsis). Bottom/top center toasts already use near full width (`left/right: 16`).

---

## [2.2.2] - 2026-07-17

### Fixed

- **Android SPSheet bottom gap / nav overlap** — Modal uses `navigationBarTranslucent` + screen height so the sheet draws edge-to-edge (no black strip under the sheet).
- **SPSheet safe area (React Navigation parity)** — nested `SafeAreaProvider` inside the Modal window; bottom sheets get `paddingBottom: insets.bottom` (with `screen − window` fallback when insets are 0). Content sits above the 3-button / gesture nav like BottomTabBar.
- Optional peer: `react-native-safe-area-context` (>=4). Without it, Dimensions fallback is used.

---

## [2.2.1] - 2026-07-16

### Fixed

- **Android ActionToast host** — transparent `Modal` (parity with iOS `FullWindowOverlay`) so cards render above the native stack header; avoids the old in-tree overlay pushing the tab bar.
- **Android top / center / corner** — visible above native headers via Modal host.
- **Android top safe area** — `getStatusBarHeight()` uses `safe-area-context` insets when available (plus `StatusBar.currentHeight` / min 24) so top cards clear the status bar under translucent Modal.
- **iOS FullWindowOverlay** — keeps explicit window `width`/`height` + `flex: 1` body sizing (Fabric).

---

## [2.2.0] - 2026-07-15

### Added

- **ActionToast stack / queue** — `mode: 'stack' | 'queue'`, `maxVisible` (default 3). Overflow waits in FIFO; dismissed toasts promote the next.
- **Positions** — `top` | `bottom` | `center` | `topLeft` | `topRight` | `bottomLeft` | `bottomRight`.
- **Animations** — `slide` | `fade` | `fadeSlide` | `spring` | `none` (entry direction from position).
- **Customization** — `type` presets, `icon`, `backgroundColor` / `textColor` / `iconColor`, card `onPress`, `pressDismiss`, `closeable`, `title`, `id` replace, `ActionToast.clear()`, `ActionToast.setDefaults()`.
- **Exports** — `TOAST_POSITIONS`, `TOAST_ANIMATIONS`, `TOAST_MODES`.
- **Git-only playground** — development screen covering positions, stack/queue, animations, CTA, id replacement, legacy shim, and an automatic visual tour. The `examples/` directory is excluded from npm.

### Changed

- **Legacy banner Toast UI removed.** `Toast.show` / `Toast.hide` remain and redirect to ActionToast (card). `timeColor` / statusBar* options ignored. Prefer `ActionToast.show`.
- Root no longer mounts the old full-width Toast view.
- `react-native-screens >= 3.16.0` is now an explicit peer dependency. ActionToast uses `FullWindowOverlay` on iOS and a non-blocking root overlay on Android/Web.

### Fixed

- Top, center, and corner positions now render in an explicitly sized full-screen host above native-stack screens.
- Queue interruptions remain strictly one-at-a-time, including consecutive queue calls and stack calls made while a queue card is active.
- `id` replacement resets auto-dismiss timing; `ActionToast.show()` returns the resolved id.
- `fade`, `slide`, `fadeSlide`, `spring`, and `none` now execute distinct entrance behavior.
- `ActionToast.clear()` removes visible and pending items without firing close callbacks for cards that never opened.
- Root applies its public `style` prop and updates toast placement after screen-size/orientation changes.
- The package smoke test now imports the production queue and legacy-mapper sources instead of testing duplicated implementations.

### Compatibility

- Existing `ActionToast.show({ message, duration, bottomOffset, action })` cart flow still works (white bar + CTA when no `type` / `backgroundColor`).

---

## [2.1.1] - 2026-07-10

### Changed

- Version bump for npm publish of the 2.1 hook SPSheet / animated Popup / configurable mask release.

---

## [2.1.0] - 2026-07-10

### Added

- **Popup card animations** — `animation`: `slide` | `fade` | `fadeSlide` | `spring` | `none`; `from`: `bottom` | `top` | `left` | `right` | `center`. Mask stays static.
- **Configurable mask color/opacity** (Popup + SPSheet) — `background`, `maskColor`, `maskOpacity` / `opacity`, or `mask: { color, opacity }`.
- **Exports** — `POPUP_ANIMATIONS`, `POPUP_FROM`.
- **Hook-based SPSheet** — core rewritten as `SPSheetHost` (hooks) with a thin class wrapper so `SPSheet.show` / `hide` / `setHeight` / `reportContentHeight` stay unchanged.
- **Sheet animations** — `animation`: `slide` | `fade` | `fadeSlide` | `spring` | `none`.
- **Entry direction** — `from`: `bottom` | `top` | `left` | `right` | `center`.
- **Backdrop animation** — `backdropAnimation`: `fade` | `none` (or `{ type, duration, closeDuration }`).
- **Detailed override** — `sheetAnimation: { type, from, duration, closeDuration, bounciness, speed }`.
- **Exports** — `SHEET_ANIMATIONS`, `SHEET_FROM`, `BACKDROP_ANIMATIONS`, `LAYER_Z`.
- **Popup portal** — when SPSheet Modal is open, `Popup` renders via `PopupPortal` + `OverlayBus` inside the sheet Modal (iOS cannot stack a second Modal reliably).
- **`zIndex`** on sheet / popup for stacking inside the shared host (defaults: sheet `10`, popup `100`).
- Richer `customStyles`: `backdrop`, `overlay`, `handle` in addition to container / drag styles.

### Fixed

- **Missing dim/mask again** — restored 2.0.0 Fabric-safe dim: static `backgroundColor` on Modal root overlay with explicit `WIDTH × HEIGHT`. Animated backdrop opacity removed (unreliable inside Modal).
- **Popup mask missing over SPSheet** — portal dim now uses explicit `WIDTH×HEIGHT` + static `backgroundColor` (same Fabric-safe pattern as sheet). `OverlayBus.setHostActive` marks sheet Modal open so `Popup.show` portals immediately and stacks above the drawer.
- **Mask tap not closing** — dim root is a full-screen `Pressable`; sheet is a nested `Pressable` so content taps do not bubble to dismiss. `closeOnPressMask` works again.
- **Fabric crash** `Cannot assign to property 'state' which has only a getter` — removed `get state()` / `get open()` from the SPSheet class wrapper (React assigns `instance.state`). Use `isOpen()` / `getState()` instead.

### Changed

- Default open/close durations: sheet `280` / `240` ms; popup card `260` / `200` ms.
- Dim/mask is **static** on Modal root (explicit size + color). Sheet/card motion uses native-driver translate / opacity / scale.

---

## [2.0.1] - 2026-07-09

### Fixed

- **Popup behind SPSheet** — `Popup` uses native `Modal` (`presentationStyle="overFullScreen"`) so alerts opened from a sheet appear on top.
- **Popup never appearing** — keep `open: true` for the whole lifecycle; do not drive `Modal.visible` from `start` alone.
- **Popup invisible on Fabric** — removed Animated opacity on the dim layer (same SPSheet lesson). Dim is a static `backgroundColor`; only the card slides with native driver.

---

## [2.0.0] - 2026-07-09

Major release with **ActionToast**, a fully reworked **SPSheet** (auto height, keyboard, measure-before-open, Fabric-safe dim), and safer callback handling.

### Added

- **`ActionToast`** — bottom floating action bar for cart success, quick CTA, and dismiss. Mounted automatically in `Root`.
- **`SPSheet.reportContentHeight(height)`** — alias of `setHeight()` for content-driven sizing from sheet body.
- **`autoHeight`** — sheet height follows content instead of a fixed value.
- **`maxHeight`** — caps sheet height (default: 92% of screen).
- **`allowHeightShrink`** — allow or block height reduction after open.
- **Measure-before-open** — `autoHeight` sheets render off-screen first, report height, then animate once at the correct size (no small-then-grow flicker).
- **`sheetProps` on body component** — `{ sheetHeight, keyboardInset, measuring }` passed to `component`.
- TypeScript definitions for `ActionToast`, `SheetConfig`, `SheetBodyProps`, `reportContentHeight`, and full Popup/Toast option surfaces.

### Changed

- **Popup confirm** — Cancel + primary buttons side-by-side (outline left, filled right).
- **Popup styling** — Modern card (20px radius, shadow), pill buttons, `#D6001F` primary default.
- Confirm dialogs hide the top icon by default (cleaner delete/confirm UX).
- `cancelButtonText` accepted as alias for `confirmText` (backward compatible).
- `Root` now mounts `ActionToast` alongside `Toast` and `SPSheet`.
- SPSheet styling: rounded handle, shadow, 16px top radius.
- SPSheet renders in native `Modal` (`presentationStyle="overFullScreen"`) wrapped in a host `View`.

### Fixed

- `onOpen` no longer blocks the open animation when provided.
- **SPSheet callback crash** (`false is not a function`) — callbacks stored on instance; `runCallback()` guards all invocations.
- **Animated value crash** (`getValue of undefined`) — animated values live on instance, reset on each `show()`.
- **SPSheet Fabric dim** — dim `backgroundColor` on Modal root overlay with explicit `WIDTH × HEIGHT` (original `modalContainer` pattern). AbsoluteFill-only mask children can layout to 0×0 under New Architecture + Reanimated.
- **SPSheet press-to-dismiss** — full-screen `Pressable` over the dim; `closeOnPressMask` works again (including while opening).
- **SPSheet drag crash** — pan uses `pan.setValue` instead of `Animated.event` + native driver (Fabric `Object is not a function`).
- **SPSheet slide** — sheet uses `translateY` + native driver; dim is static (no opacity animation).
- **Keyboard handling** — sheet lifts via keyboard inset; iOS keyboard corner gap fill (`keyboardGapFill`).
- **Height race on open** — `setHeight()` / `reportContentHeight()` queued until open animation completes.

---

## [1.0.4] - 2025-04-16

### Fixed

- Resolved an issue where the popup component would block interaction with the underlying UI after being closed.
- Updated internal `pointerEvents` handling to `'box-none'` to ensure compatibility with React Native 0.78+ gesture and layer changes.
