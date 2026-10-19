import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import { useAppTheme } from '../context/ThemeContext';
import { RootStackParamList, MainTabParamList } from './types';

// Écrans Authentification
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Écrans Protégés (Tabs principales)
import HomeScreen from '../screens/forum/HomeScreen';
import EnterpriseListScreen from '../screens/forum/EnterpriseListScreen';
import MapNavigator from './MapNavigator';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/forum/SettingsScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

// Écrans Protégés (Stack secondaire hors-barre)
import AnnouncementsScreen from '../screens/forum/AnnouncementsScreen';
import SatisfactionScreen from '../screens/forum/SatisfactionScreen';
import EnterpriseDetailScreen from '../screens/forum/EnterpriseDetailScreen';
import ScanBadgeScreen from '../screens/admin/ScanBadgeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 1. Navigation des onglets principaux avec contrôle dynamique selon le rôle
function MainTabs() {
    const { user } = useAuthStore();
    const { colors } = useAppTheme();
    const isAdmin = user?.role === 'admin';

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.outline,
                tabBarStyle: {
                    backgroundColor: colors.surfaceContainerLowest,
                    borderTopColor: colors.surfaceContainerHighest,
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: 8,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                },
                tabBarLabelStyle: {
                    fontFamily: 'Poppins-SemiBold',
                    fontSize: 11,
                    marginTop: 2,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline';

                    if (route.name === 'Accueil') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Entreprises') {
                        iconName = focused ? 'business' : 'business-outline';
                    } else if (route.name === 'Plan') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'Profil') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    } else if (route.name === 'Dashboard') {
                        iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    } else if (route.name === 'Scan') {
                        iconName = focused ? 'scan' : 'scan-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            {/* Onglets visibles uniquement pour les étudiants */}
            {!isAdmin && (
                <>
                    <Tab.Screen
                        name="Accueil"
                        component={HomeScreen}
                        options={{ tabBarLabel: 'Accueil' }}
                    />
                    <Tab.Screen
                        name="Plan"
                        component={MapNavigator}
                        options={{ tabBarLabel: 'Plan' }}
                    />
                </>
            )}

            {/* Onglets communs */}
            <Tab.Screen
                name="Entreprises"
                component={EnterpriseListScreen}
                options={{ tabBarLabel: 'Entreprises' }}
            />
            <Tab.Screen
                name="Profil"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Profil' }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarLabel: 'Réglages' }}
            />

            {/* Onglets visibles uniquement pour l'administrateur / recruteur */}
            {isAdmin && (
                <>
                    <Tab.Screen
                        name="Dashboard"
                        component={AdminDashboardScreen}
                        options={{ tabBarLabel: 'Dashboard' }}
                    />
                    <Tab.Screen
                        name="Scan"
                        component={ScanBadgeScreen}
                        options={{ tabBarLabel: 'Scanner' }}
                    />
                </>
            )}
        </Tab.Navigator>
    );
}

// 2. Guard de navigation principal
export default function AppNavigator() {
    const { token, loadToken } = useAuthStore();
    const { colors } = useAppTheme();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadToken().finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.surface }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {token ? (
                // --- ZONE PROTÉGÉE ---
                <>
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                    <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
                    <Stack.Screen name="Satisfaction" component={SatisfactionScreen} />
                    <Stack.Screen name="EnterpriseDetail" component={EnterpriseDetailScreen} />
                    <Stack.Screen name="ScanBadge" component={ScanBadgeScreen} />
                </>
            ) : (
                // --- ZONE PUBLIQUE ---
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});