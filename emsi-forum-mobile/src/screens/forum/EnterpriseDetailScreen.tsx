import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    SafeAreaView,
    StatusBar,
    TouchableOpacity
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import api from '../../services/api';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../context/ThemeContext';

interface Interaction {
    enterprise_id: number | string;
    visited: boolean;
    cv_dropped: boolean;
}

type Props = NativeStackScreenProps<RootStackParamList, 'EnterpriseDetail'>;

export default function EnterpriseDetailScreen({ route, navigation }: Props) {
    const { enterprise } = route.params;
    const { colors, isDark } = useAppTheme();

    const [visited, setVisited] = useState<boolean>(false);
    const [cvDropped, setCvDropped] = useState<boolean>(false);

    useEffect(() => {
        api.get<Interaction[]>('/api/interactions/')
            .then(response => {
                const interactions = response.data;
                const myInteraction = interactions.find(i => String(i.enterprise_id) === String(enterprise.id));
                if (myInteraction) {
                    setVisited(myInteraction.visited);
                    setCvDropped(myInteraction.cv_dropped);
                }
            })
            .catch(err => console.log("Erreur lors de la récupération des interactions :", err));
    }, [enterprise.id]);

    const updateInteraction = async (newVisited: boolean, newCvDropped: boolean) => {
        try {
            await api.post('/api/interactions/', {
                enterprise_id: enterprise.id,
                visited: newVisited,
                cv_dropped: newCvDropped
            });
        } catch (error) {
            console.log("Erreur lors de la sauvegarde :", error);
        }
    };

    const handleVisitedChange = (newValue: boolean) => {
        setVisited(newValue);
        updateInteraction(newValue, cvDropped);
    };

    const handleCvDroppedChange = (newValue: boolean) => {
        setCvDropped(newValue);
        updateInteraction(visited, newValue);
    };

    // Récupération de l'URL de base directement depuis l'instance Axios `api`
    const baseURL = api.defaults.baseURL || '';

    // Construction propre de l'URL du logo
    const logoUri = enterprise.logo_url
        ? enterprise.logo_url.startsWith('http')
            ? enterprise.logo_url
            : `${baseURL.replace(/\/$/, '')}${enterprise.logo_url.startsWith('/') ? '' : '/'}${enterprise.logo_url}`
        : null;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={colors.surface}
            />

            {/* Header Fixe avec bouton Retour */}
            <View style={[styles.headerNav, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceContainerHighest }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.surfaceContainerLowest }]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
                </TouchableOpacity>
                <View style={styles.headerTitleCol}>
                    <Text style={[styles.headerCategory, { color: colors.secondary }]}>
                        Forum Entreprises EMSI
                    </Text>
                    <Text style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
                        {enterprise.name}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={[styles.container, { backgroundColor: colors.surface }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero / Header Card */}
                <View style={[styles.heroCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest }]}>
                        {logoUri ? (
                            <Image source={{ uri: logoUri }} style={styles.largeLogo} />
                        ) : (
                            <View style={[styles.largeLogo, styles.placeholderLogo, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.placeholderText, { color: colors.onPrimary }]}>
                                    {enterprise.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.title, { color: colors.onSurface }]}>{enterprise.name}</Text>
                    {enterprise.category && (
                        <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceContainer }]}>
                            <MaterialIcons name="workspace-premium" size={14} color={colors.secondary} />
                            <Text style={[styles.categoryBadgeText, { color: colors.secondary }]}>
                                {enterprise.category} Sponsor
                            </Text>
                        </View>
                    )}
                </View>

                {/* Section Introduction */}
                <View style={[styles.sectionCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                    <View style={styles.sectionHeaderRow}>
                        <MaterialIcons name="info-outline" size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>A propos de l'entreprise</Text>
                    </View>
                    <Text style={[styles.descriptionText, { color: colors.onSurfaceVariant }]}>
                        {enterprise.description || "Aucune description disponible pour le moment."}
                    </Text>
                </View>

                {/* Section Profils Recherchés */}
                <View style={[styles.sectionCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                    <View style={styles.sectionHeaderRow}>
                        <MaterialIcons name="group" size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Profils recherchés</Text>
                    </View>
                    <Text style={[styles.profilesText, { color: colors.onSurfaceVariant }]}>
                        {enterprise.target_profiles || "Informations sur les profils non spécifiées."}
                    </Text>
                </View>

                {/* Section Suivi / Stand */}
                <View style={[styles.sectionCard, styles.interactionCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest }]}>
                    <View style={styles.sectionHeaderRow}>
                        <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Mon suivi avec ce stand</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.checkboxRow, { backgroundColor: colors.surfaceContainerLowest }]}
                        activeOpacity={0.8}
                        onPress={() => handleVisitedChange(!visited)}
                    >
                        <Checkbox
                            value={visited}
                            onValueChange={handleVisitedChange}
                            color={visited ? colors.primary : undefined}
                            style={styles.checkbox}
                        />
                        <Text style={[styles.checkboxLabel, { color: colors.onSurface }]}>J'ai visité ce stand</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.checkboxRow, { backgroundColor: colors.surfaceContainerLowest }]}
                        activeOpacity={0.8}
                        onPress={() => handleCvDroppedChange(!cvDropped)}
                    >
                        <Checkbox
                            value={cvDropped}
                            onValueChange={handleCvDroppedChange}
                            color={cvDropped ? colors.primary : undefined}
                            style={styles.checkbox}
                        />
                        <Text style={[styles.checkboxLabel, { color: colors.onSurface }]}>J'y ai déposé mon CV</Text>
                    </TouchableOpacity>
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
        padding: 16,
        paddingBottom: 40,
        gap: 16,
    },

    /* Header Nav Fixe */
    headerNav: {
        height: 64,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    headerTitleCol: {
        flex: 1,
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

    /* Hero Card */
    heroCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    logoContainer: {
        width: 88,
        height: 88,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    largeLogo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    placeholderLogo: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontFamily: 'Syne-Bold',
        fontSize: 32,
    },
    title: {
        fontFamily: 'Syne-Bold',
        fontSize: 22,
        textAlign: 'center',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 9999,
    },
    categoryBadgeText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },

    /* Section Cards */
    sectionCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 16,
    },
    descriptionText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        lineHeight: 22,
    },
    profilesText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        lineHeight: 22,
    },

    /* Interaction Section */
    interactionCard: {
        borderWidth: 1,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 14,
        borderRadius: 12,
        gap: 12,
    },
    checkbox: {
        borderRadius: 6,
    },
    checkboxLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },
});