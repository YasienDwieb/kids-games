import { StyleSheet, Text } from 'react-native';
import { COLORS, FONTS } from '@/sdk';

type ColorLabelProps = {
  name: string;
};

export function ColorLabel({ name }: ColorLabelProps) {
  return <Text style={styles.label}>{name}</Text>;
}

const styles = StyleSheet.create({
  label: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
});
