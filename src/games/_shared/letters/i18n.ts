import { registerTranslations } from '@/sdk';
import { en } from './locales/en';
import { ar } from './locales/ar';

// Side-effect: registers the shared letter names/words under the `letters` namespace.
registerTranslations('letters', { en, ar });
