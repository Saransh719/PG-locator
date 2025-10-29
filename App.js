import { StatusBar } from 'expo-status-bar';
import { StyleSheet,Button } from 'react-native';
import MapScreen from './screens/MapScreen';
import LoginScreen from './screens/LoginScreen';
import AddPgScreen from './screens/AddPgScreen';
import ListPgScreen from './screens/ListPgScreen';
import EditPgScreen from './screens/EditPgScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PgProvider } from './context/PgContext';
import Toast from 'react-native-toast-message';

export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    <PgProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" >
          <Stack.Screen name="Login" component={LoginScreen} options={{title : "Login"}}/>
          <Stack.Screen name="Map" component={MapScreen} options={({ navigation }) => ({
            title : "Map",
            headerRight: () => (
            <Button onPress={() => navigation.navigate('ListPg')} title="Show All"/>
          ),
            })}/>
          <Stack.Screen name="AddPg" component={AddPgScreen} options={{ title: 'Add PG' }} />
          <Stack.Screen name="ListPg" component={ListPgScreen} options={{ title: 'All PGs' }} />
          <Stack.Screen name="EditPg" component={EditPgScreen} options={{ title: 'Edit PG' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast position='bottom' />
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
