import type { ModalProps } from 'react-native';

// iOS presents a Modal in portrait unless told otherwise, and a landscape-only app
// (app.json) then crashes in release builds. Every Modal must pass this.
export const MODAL_ORIENTATIONS: ModalProps['supportedOrientations'] = ['landscape-left', 'landscape-right'];
