import { registerFlowUnit, registerTopic } from '@/sdk';
import { fourCount } from './units/fourCount';
import { fourShapes } from './units/fourShapes';

registerFlowUnit(fourCount);
registerFlowUnit(fourShapes);

registerTopic({ id: 'four', unitIds: ['four-count', 'four-shapes'] });
