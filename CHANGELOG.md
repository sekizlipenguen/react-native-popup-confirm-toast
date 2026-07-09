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
- TypeScript definitions for `ActionToast`, `SheetConfig`, and `reportContentHeight`.

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
