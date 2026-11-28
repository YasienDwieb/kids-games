import { StyleSheet, View } from 'react-native';
import { ACCENTS, POP } from '@/constants/colors';
import { OUTLINE } from '@/constants/dimensions';

/**
 * Stand-in Ramadan lantern (fanoos) drawn from shapes in the Pop Quest style:
 * brass cap and base, warm glass, ink outline, a soft glow. Replace with the
 * illustrated PNG via an `image` art piece when it lands. `size` = height.
 */
export function Fanoos({ size, glow = true }: { size: number; glow?: boolean }) {
  const w = size * 0.56;
  const line = Math.max(1.5, size * 0.025);
  const edge = { borderWidth: line, borderColor: OUTLINE.color };
  return (
    <View style={{ width: w, height: size, alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {glow ? (
        <View
          style={[
            styles.glow,
            { width: size * 0.95, height: size * 0.95, borderRadius: size, top: size * 0.12, left: (w - size * 0.95) / 2 },
          ]}
        />
      ) : null}
      {/* hanging ring */}
      <View style={[edge, { width: w * 0.24, height: w * 0.24, borderRadius: w, backgroundColor: 'transparent' }]} />
      {/* dome cap */}
      <View
        style={[
          edge,
          {
            marginTop: -line,
            width: w * 0.74,
            height: size * 0.17,
            borderTopLeftRadius: w,
            borderTopRightRadius: w,
            backgroundColor: ACCENTS.orange.base,
          },
        ]}
      />
      {/* glass body with brass bars */}
      <View
        style={[
          edge,
          {
            marginTop: -line,
            width: w,
            height: size * 0.46,
            borderRadius: w * 0.16,
            backgroundColor: POP.zap,
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            overflow: 'hidden',
          },
        ]}
      >
        <View style={{ position: 'absolute', width: w * 0.46, height: w * 0.46, borderRadius: w, backgroundColor: ACCENTS.orange.tint }} />
        <View style={{ width: line, height: '100%', backgroundColor: OUTLINE.color }} />
        <View style={{ width: line, height: '100%', backgroundColor: OUTLINE.color }} />
      </View>
      {/* brass base */}
      <View
        style={[
          edge,
          {
            marginTop: -line,
            width: w * 0.74,
            height: size * 0.1,
            borderBottomLeftRadius: w * 0.3,
            borderBottomRightRadius: w * 0.3,
            backgroundColor: ACCENTS.orange.base,
          },
        ]}
      />
      {/* finial */}
      <View style={[edge, { marginTop: -line, width: w * 0.16, height: w * 0.16, borderRadius: w, backgroundColor: ACCENTS.orange.deep }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', backgroundColor: POP.zap, opacity: 0.35 },
});
