import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import './src/i18n';

import { colors } from './src/theme';
import type { RootStackParamList } from './src/types/navigation';

import { HomeScreen } from './src/screens/HomeScreen';
import { PlanTripScreen } from './src/screens/PlanTripScreen';
import { TripScreen } from './src/screens/TripScreen';
import { WhatsAheadScreen } from './src/screens/WhatsAheadScreen';
import { ReportIssueScreen } from './src/screens/ReportIssueScreen';
import { SosScreen } from './src/screens/SosScreen';
import { RouteUpdateScreen } from './src/screens/RouteUpdateScreen';

import { DemoProvider } from './src/context/DemoContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.brand,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <DemoProvider>
        <StatusBar style="dark" />
        <NavigationContainer theme={AppNavTheme}>
        <Stack.Navigator
          initialRouteName="DriverHome"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="DriverHome" component={HomeScreen} />
          <Stack.Screen name="PlanTrip" component={PlanTripScreen} />
          <Stack.Screen name="Trip" component={TripScreen} />
          <Stack.Screen name="WhatsAhead" component={WhatsAheadScreen} />
          <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
          <Stack.Screen
            name="Sos"
            component={SosScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="RouteUpdate"
            component={RouteUpdateScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      </DemoProvider>
    </SafeAreaProvider>
  );
}
