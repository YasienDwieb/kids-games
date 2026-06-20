import { View } from 'react-native';
import { ShapeView } from '@/games/shape-detective/components/ShapeView';

/** A star sprite centered on its anchor point (for use as Actor.content). */
export function StarSprite({ color, size = 64 }: { color: string; size?: number }) {
  return (
    <View style={{ marginLeft: -size / 2, marginTop: -size / 2 }}>
      <ShapeView shape={{ kind: 'star', color, size: size >= 80 ? 'large' : size >= 56 ? 'medium' : 'small' }} />
    </View>
  );
}
