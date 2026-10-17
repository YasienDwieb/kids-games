/**
 * Trace It — standalone screen. The picker chooses a character; a Round traces
 * it (guided then on-your-own) and returns to the picker. Back from a round
 * goes to the picker, back from the picker leaves the game.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS, useScreenBack } from '@/sdk';
import { currentScript, type TabId, type TraceChar } from './catalog';
import { Picker } from './components/Picker';
import { Round } from './components/Round';

export default function TraceIt() {
  const [selected, setSelected] = useState<TraceChar | null>(null);
  const script = currentScript();
  const [tab, setTab] = useState<TabId>(script);

  useScreenBack(() => {
    if (!selected) return false;
    setSelected(null);
    return true;
  });

  return (
    <View style={styles.root}>
      {selected ? (
        <Round key={selected.id} char={selected} mode="full" onFinished={() => setSelected(null)} />
      ) : (
        <Picker script={script} tab={tab} onTab={setTab} onPick={setSelected} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas },
});
