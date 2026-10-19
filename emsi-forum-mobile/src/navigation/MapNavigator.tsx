import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Map2DScreen from '@/screens/map/Map2DScreen';
import Map3DScreen from '@/screens/map/Map3DScreen';
import { MapStackParamList } from './types';
import { useAppTheme } from '../context/ThemeContext';

const Tab = createMaterialTopTabNavigator<MapStackParamList>();

export default function MapNavigator() {
    const { colors } = useAppTheme();

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.outline,
                    tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 3 },
                    tabBarStyle: {
                        backgroundColor: colors.surfaceContainerLowest,
                        elevation: 2,
                        shadowOpacity: 0.1,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.surfaceContainerHighest,
                    },
                    tabBarLabelStyle: {
                        fontFamily: 'Poppins-SemiBold',
                        fontSize: 13,
                        textTransform: 'none',
                    }
                }}
            >
                <Tab.Screen
                    name="Map2D"
                    component={Map2DScreen}
                    options={{ tabBarLabel: 'Plan 2D' }}
                />
                <Tab.Screen
                    name="Map3D"
                    component={Map3DScreen}
                    options={{ tabBarLabel: 'Vue 3D' }}
                />
            </Tab.Navigator>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    }
});