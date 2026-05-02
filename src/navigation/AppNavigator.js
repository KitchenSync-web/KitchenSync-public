import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import CreateListScreen from '../screens/CreateListScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
import MyListsScreen from '../screens/MyListsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyLists" component={MyListsScreen} />
      <Stack.Screen name="CreateList" component={CreateListScreen} />
      <Stack.Screen name="ListDetail" component={ListDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}