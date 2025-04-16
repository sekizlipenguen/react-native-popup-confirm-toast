## [1.0.4] - 2025-04-16

### Fixed

- Resolved an issue where the popup component would block interaction with the underlying UI after being closed.
- Updated internal `pointerEvents` handling to `'box-none'` to ensure compatibility with React Native 0.78+ gesture and layer changes.
