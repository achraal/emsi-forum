import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold
} from '@expo-google-fonts/inter';
import {
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold
} from '@expo-google-fonts/poppins';
import {
    Syne_700Bold,
    Syne_800ExtraBold
} from '@expo-google-fonts/syne';

import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// Empêche le splash screen de disparaître automatiquement avant le chargement des polices
SplashScreen.preventAutoHideAsync();

export default function App() {
    const [fontsLoaded] = useFonts({
        'Inter-Regular': Inter_400Regular,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
        'Poppins-Regular': Poppins_400Regular,
        'Poppins-SemiBold': Poppins_600SemiBold,
        'Poppins-Bold': Poppins_700Bold,
        'Syne-Bold': Syne_700Bold,
        'Syne-ExtraBold': Syne_800ExtraBold,
    });

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded) {
            // Masque le splash screen une fois les polices prêtes
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <ThemeProvider>
            <View style={styles.container} onLayout={onLayoutRootView}>
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </View>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});