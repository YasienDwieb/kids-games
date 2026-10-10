import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';
import {
  HomeScreen,
  GamePlayerScreen,
  SettingsScreen,
  FlowPlayerScreen,
  WardrobeScreen,
  QuestsScreen,
} from '../../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      {/* Games own horizontal drags; the iOS edge swipe-back would steal them. */}
      <Stack.Screen name="GamePlayer" component={GamePlayerScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="FlowPlayer" component={FlowPlayerScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Wardrobe" component={WardrobeScreen} />
      <Stack.Screen name="Quests" component={QuestsScreen} />
    </Stack.Navigator>
  );
}
