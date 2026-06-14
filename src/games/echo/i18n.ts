import { registerTranslations } from '@/sdk';
import { en } from './locales/en';
import { ar } from './locales/ar';

// Side-effect: registers this game's translation bundles under its id namespace.
// Imported from config.ts so it runs when the game registers itself.
registerTranslations('echo', { en, ar });
