import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../context/ThemeContext';

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { logout, user } = useAuthStore();
    const { themeMode, setThemeMode, colors, isDark } = useAppTheme();

    const handleLogout = () => {
        Alert.alert(
            "Déconnexion",
            "Êtes-vous sûr de vouloir vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Se déconnecter",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={colors.surface}
            />

            {/* Header Fixe */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceContainerHighest }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.surfaceContainerLow }]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
                </TouchableOpacity>
                <View style={styles.headerTitleCol}>
                    <Text style={[styles.headerCategory, { color: colors.secondary }]}>
                        Forum Entreprises EMSI
                    </Text>
                    <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                        Paramètres
                    </Text>
                </View>
            </View>

            <ScrollView
                style={[styles.container, { backgroundColor: colors.surface }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Section Préférences d'Affichage / Thème */}
                <Text style={[styles.sectionHeader, { color: colors.outline }]}>
                    THÈME DE L'APPLICATION
                </Text>
                <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}>
                    {/* Option 1: Système */}
                    <TouchableOpacity
                        style={styles.themeOptionRow}
                        onPress={() => setThemeMode('system')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainer }]}>
                                <MaterialIcons name="settings-suggest" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.settingTextCol}>
                                <Text style={[styles.settingTitle, { color: colors.onSurface }]}>Système</Text>
                                <Text style={[styles.settingSubtitle, { color: colors.onSurfaceVariant }]}>
                                    Adapter automatiquement au thème du téléphone
                                </Text>
                            </View>
                        </View>
                        <MaterialIcons
                            name={themeMode === 'system' ? "radio-button-checked" : "radio-button-unchecked"}
                            size={22}
                            color={themeMode === 'system' ? colors.primary : colors.outline}
                        />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.surfaceContainerLow }]} />

                    {/* Option 2: Mode Clair */}
                    <TouchableOpacity
                        style={styles.themeOptionRow}
                        onPress={() => setThemeMode('light')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainer }]}>
                                <MaterialIcons name="wb-sunny" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.settingTextCol}>
                                <Text style={[styles.settingTitle, { color: colors.onSurface }]}>Mode Clair</Text>
                                <Text style={[styles.settingSubtitle, { color: colors.onSurfaceVariant }]}>
                                    Thème lumineux toujours actif
                                </Text>
                            </View>
                        </View>
                        <MaterialIcons
                            name={themeMode === 'light' ? "radio-button-checked" : "radio-button-unchecked"}
                            size={22}
                            color={themeMode === 'light' ? colors.primary : colors.outline}
                        />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.surfaceContainerLow }]} />

                    {/* Option 3: Mode Sombre */}
                    <TouchableOpacity
                        style={styles.themeOptionRow}
                        onPress={() => setThemeMode('dark')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainer }]}>
                                <MaterialIcons name="dark-mode" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.settingTextCol}>
                                <Text style={[styles.settingTitle, { color: colors.onSurface }]}>Mode Sombre</Text>
                                <Text style={[styles.settingSubtitle, { color: colors.onSurfaceVariant }]}>
                                    Thème sombre toujours actif
                                </Text>
                            </View>
                        </View>
                        <MaterialIcons
                            name={themeMode === 'dark' ? "radio-button-checked" : "radio-button-unchecked"}
                            size={22}
                            color={themeMode === 'dark' ? colors.primary : colors.outline}
                        />
                    </TouchableOpacity>
                </View>

                {/* Section Navigation Rapide */}
                <Text style={[styles.sectionHeader, { color: colors.outline }]}>
                    RACCOURCIS DU FORUM
                </Text>
                <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}>
                    <TouchableOpacity
                        style={styles.settingRowTouchable}
                        onPress={() => navigation.navigate('Announcements')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainer }]}>
                                <MaterialIcons name="campaign" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.settingTextCol}>
                                <Text style={[styles.settingTitle, { color: colors.onSurface }]}>Annonces du Forum</Text>
                                <Text style={[styles.settingSubtitle, { color: colors.onSurfaceVariant }]}>
                                    Consulter les actualités et keynotes
                                </Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.surfaceContainerLow }]} />

                    <TouchableOpacity
                        style={styles.settingRowTouchable}
                        onPress={() => navigation.navigate('Satisfaction')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainer }]}>
                                <MaterialIcons name="star-outline" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.settingTextCol}>
                                <Text style={[styles.settingTitle, { color: colors.onSurface }]}>Donner mon Avis</Text>
                                <Text style={[styles.settingSubtitle, { color: colors.onSurfaceVariant }]}>
                                    Évaluer le déroulement de l'événement
                                </Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
                    </TouchableOpacity>
                </View>

                {/* Section Compte & Sécurité */}
                <Text style={[styles.sectionHeader, { color: colors.outline }]}>COMPTE</Text>
                <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}>
                    <TouchableOpacity
                        style={styles.settingRowTouchable}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.errorContainer }]}>
                                <MaterialIcons name="logout" size={20} color={colors.error} />
                            </View>
                            <View style={styles.settingTextCol}>
                                <Text style={[styles.settingTitle, { color: colors.error }]}>Se déconnecter</Text>
                                <Text style={[styles.settingSubtitle, { color: colors.onSurfaceVariant }]}>
                                    Fermer votre session active
                                </Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
                    </TouchableOpacity>
                </View>

                {/* Footer Info Application */}
                <View style={styles.footerInfo}>
                    <Text style={[styles.footerVersion, { color: colors.outline }]}>
                        Forum Entreprises EMSI v2.0
                    </Text>
                    <Text style={[styles.footerUser, { color: colors.onSurfaceVariant }]}>
                        Connecté en tant que : {user?.email || 'Étudiant'}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 12,
    },
    header: {
        height: 64,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        gap: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleCol: {
        justifyContent: 'center',
    },
    headerCategory: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    headerTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 17,
    },
    sectionHeader: {
        fontFamily: 'Inter-Bold',
        fontSize: 11,
        letterSpacing: 0.5,
        marginTop: 12,
        marginLeft: 4,
    },
    card: {
        borderRadius: 16,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    themeOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    settingRowTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingTextCol: {
        flex: 1,
    },
    settingTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },
    settingSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
    footerInfo: {
        alignItems: 'center',
        marginTop: 24,
        gap: 4,
    },
    footerVersion: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    footerUser: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
    },
});