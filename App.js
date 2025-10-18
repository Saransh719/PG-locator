import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import MapScreen from './screens/MapScreen';
import LoginScreen from './screens/LoginScreen';
import AddPgScreen from './screens/AddPgScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PgProvider } from './context/PgContext';

export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    <PgProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerTitle: 'PG locator' }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="AddPg" component={AddPgScreen} options={{ title: 'Add PG' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </PgProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
