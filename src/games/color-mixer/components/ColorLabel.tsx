import { StyleSheet, Text } from 'react-native';

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
    fontWeight: '600',
    color: '#424242',
    textAlign: 'center',
  },
});
