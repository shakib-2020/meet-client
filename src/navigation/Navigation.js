import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import JoinMeetScreen from '../screens/JoinMeetScreen';
import PrepareMeetScreen from '../screens/PrepareMeetScreen';
import LiveMeetScreen from '../screens/LiveMeetScreen';
import {navigationRef} from '../utils/NavigationUtils';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="JoinMeetScreen" component={JoinMeetScreen} />
        <Stack.Screen name="PrepareMeetScreen" component={PrepareMeetScreen} />
        <Stack.Screen name="LiveMeetScreen" component={LiveMeetScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;

const styles = StyleSheet.create({});
