import { createContext } from 'react';
import type { SoundOverrides } from '@/sdk/assets/query';

/** The active game's `config.sounds`, provided by GamePlayerScreen and read by useSound. */
export const SoundOverridesContext = createContext<SoundOverrides>({});
