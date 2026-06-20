import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';
import { HomeScreen, GamePlayerScreen, SettingsScreen, FlowPlayerScreen } from '../../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="GamePlayer" component={GamePlayerScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="FlowPlayer" component={FlowPlayerScreen} />
    </Stack.Navigator>
  );
}
