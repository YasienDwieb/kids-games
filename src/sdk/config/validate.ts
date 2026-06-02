import type { GameConfig } from './types';

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateGameConfig(config: GameConfig): void {
  const fail = (msg: string): never => {
    throw new Error(`Invalid game config: ${msg}`);
  };

  if (!config.id || typeof config.id !== 'string') fail('id is required');
  if (!ID_RE.test(config.id)) fail(`id "${config.id}" must be kebab-case (a-z, 0-9, hyphens)`);
  if (!config.name) fail(`id "${config.id}": name is required`);
  if (!config.description) fail(`id "${config.id}": description is required`);
  if (!config.icon) fail(`id "${config.id}": icon is required`);
  if (!config.backgroundColor) fail(`id "${config.id}": backgroundColor is required`);
  if (typeof config.component !== 'function') fail(`id "${config.id}": component is required`);

  const { ageRange } = config;
  if (!ageRange || typeof ageRange.min !== 'number' || typeof ageRange.max !== 'number') {
    fail(`id "${config.id}": ageRange { min, max } is required`);
  } else if (ageRange.min > ageRange.max) {
    fail(`id "${config.id}": ageRange.min (${ageRange.min}) must be <= ageRange.max (${ageRange.max})`);
  }
}
