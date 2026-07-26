# iOS App Store screenshots

Kids Zone is **landscape-only**, so capture screenshots in landscape.

## Required sizes (App Store Connect, 2025)

You must provide at least one set. The 6.9" iPhone set is required; the 13"
iPad set is required because the app declares `supportsTablet: true`.

| Device            | Portrait     | Landscape    |
|-------------------|--------------|--------------|
| 6.9" iPhone       | 1290 x 2796  | 2796 x 1290  |
| 6.5" iPhone (alt) | 1242 x 2688  | 2688 x 1242  |
| 13" iPad          | 2064 x 2752  | 2752 x 2064  |

Provide **2–10** screenshots per device set. Since the app is landscape, use
the landscape dimensions above.

## How to capture

1. `eas build -p ios --profile preview` (or run on a Simulator via
   `npx expo run:ios`), then screenshot on an iPhone 16 Pro Max simulator
   (6.9") and an iPad Pro 13" simulator.
2. Name them `01.png`, `02.png`, ... in capture order.
3. Put iPhone shots and iPad shots in clearly separate subfolders (create
   `iphone-6.9/` and `ipad-13/` here).

## How to upload

Simplest: upload directly in the App Store Connect UI when preparing the
version (drag-and-drop per device size). This avoids wiring screenshot paths
into `store.config.json`.
