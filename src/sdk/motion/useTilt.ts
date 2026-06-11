/* Tilt input — normalized screen-horizontal device tilt for motion-controlled
   games. Wraps expo-sensors' Accelerometer and maps the gravity vector onto
   the CURRENT screen orientation, so "tilt toward the right edge of the
   screen" is always positive regardless of portrait/landscape rotation. */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as ScreenOrientation from 'expo-screen-orientation';

const UPDATE_MS = 50;
/** Low-pass factor: out = prev * (1 - ALPHA) + sample * ALPHA. */
const ALPHA = 0.35;

/**
 * Subscribe to device tilt while `enabled`.
 *
 * `onTilt` receives the gravity component along the screen-right axis in g
 * units (≈ sin(tilt angle)): 0 when the screen is level, positive when the
 * screen's right edge dips down, negative for the left edge. Typical full
 * deflection for game steering is ±0.2–0.3 g (~12–17°).
 */
export function useTilt(enabled: boolean, onTilt: (tilt: number) => void): void {
  const cb = useRef(onTilt);
  cb.current = onTilt;

  useEffect(() => {
    if (!enabled) return;

    let orientation = ScreenOrientation.Orientation.PORTRAIT_UP;
    ScreenOrientation.getOrientationAsync()
      .then((o) => {
        orientation = o;
      })
      .catch(() => {});
    const orientationSub = ScreenOrientation.addOrientationChangeListener((e) => {
      orientation = e.orientationInfo.orientation;
    });

    let smoothed = 0;
    Accelerometer.setUpdateInterval(UPDATE_MS);
    const sub = Accelerometer.addListener(({ x, y }) => {
      // Normalize to the "earthward" gravity direction in device coords:
      // iOS reports toward-earth, Android reports the reaction (away).
      const sign = Platform.OS === 'android' ? -1 : 1;
      const ex = x * sign;
      const ey = y * sign;

      // Project earthward onto the screen-right axis for this orientation.
      let t: number;
      switch (orientation) {
        case ScreenOrientation.Orientation.LANDSCAPE_LEFT:
          t = -ey;
          break;
        case ScreenOrientation.Orientation.LANDSCAPE_RIGHT:
          t = ey;
          break;
        case ScreenOrientation.Orientation.PORTRAIT_DOWN:
          t = -ex;
          break;
        default: // PORTRAIT_UP / UNKNOWN
          t = ex;
      }

      smoothed = smoothed * (1 - ALPHA) + t * ALPHA;
      cb.current(smoothed);
    });

    return () => {
      sub.remove();
      orientationSub.remove();
    };
  }, [enabled]);
}
