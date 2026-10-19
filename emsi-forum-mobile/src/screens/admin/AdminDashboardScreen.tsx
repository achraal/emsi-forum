import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TextInput,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import api from '../../services/api';
import { MainTabScreenProps } from '../../navigation/types';

// Palette de couleurs extraite de la charte EMSI / Tailwind
const COLORS = {
    primary: '#006b31',
    primaryContainer: '#008740',
    onPrimary: '#ffffff',
    surface: '#f5fbf4',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#eff5ee',
    surfaceContainer: '#e9f0e8',
    surfaceContainerHigh: '#e4eae3',
    surfaceContainerHighest: '#dee4dd',
    secondary: '#216b3c',
    secondaryContainer: '#a5f1b4',
    onSecondaryContainer: '#26703f',
    tertiary: '#ae290c',
    tertiaryContainer: '#fce8e6',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onSurface: '#171d19',
    onSurfaceVariant: '#3e4a3f',
    outline: '#6e7a6e',
    ratingStar: '#f59e0b',
};

export interface EnterpriseVisits {
    id?: number | string;
    name: string;
    visits: number;
}

export interface KPIsData {
    total_students: number;
    total_cvs_dropped: number;
    average_forum_rating: string | number;
    top_enterprises: EnterpriseVisits[];
}

// --- Sous-composant pour le formulaire d'annonce ---
export function AdminAnnouncementForm() {
    const [title, setTitle] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [sending, setSending] = useState<boolean>(false);

    const sendAnnouncement = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir le titre et le message.');
            return;
        }

        setSending(true);
        try {
            await api.post('/api/announcements/', { title: title.trim(), message: message.trim() });
            Alert.alert('Succès', 'L\'annonce a été envoyée par notification à tous les étudiants !');
            setTitle('');
            setMessage('');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'envoyer l\'annonce.');
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={styles.formCard}>
            <View style={styles.sectionHeaderRow}>
                <View style={styles.iconHeaderBoxAlert}>
                    <MaterialIcons name="campaign" size={20} color={COLORS.tertiary} />
                </View>

                <View style={styles.headerTextCol}>
                    <Text style={styles.sectionTitle}>Diffuser une annonce Push</Text>
                    <Text style={styles.sectionSubtitle}>Alertez l'ensemble des étudiants inscrits</Text>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TITRE DE LA NOTIFICATION</Text>
                <TextInput
                    style={styles.input}
                    placeholder="ex: Session de pitchs déplacée au Hall B"
                    placeholderTextColor={COLORS.outline}
                    value={title}
                    onChangeText={setTitle}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MESSAGE DÉTAILLÉ</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Saisissez le contenu de l'annonce..."
                    placeholderTextColor={COLORS.outline}
                    multiline
                    value={message}
                    onChangeText={setMessage}
                />
            </View>

            <TouchableOpacity
                style={[styles.announceButton, sending && styles.buttonDisabled]}
                onPress={sendAnnouncement}
                disabled={sending}
                activeOpacity={0.8}
            >
                {sending ? (
                    <ActivityIndicator color={COLORS.onPrimary} />
                ) : (
                    <>
                        <MaterialIcons name="send" size={18} color={COLORS.onPrimary} />
                        <Text style={styles.announceButtonText}>Envoyer la notification push</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}

// --- Composant Principal du Dashboard ---
type Props = MainTabScreenProps<'Dashboard'>;

export default function AdminDashboardScreen({ navigation, route }: Props) {
    const [kpis, setKpis] = useState<KPIsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchKPIs();
    }, []);

    const fetchKPIs = async () => {
        try {
            const response = await api.get<KPIsData>('/api/admin/kpis');
            setKpis(response.data);
        } catch (error: unknown) {
            console.error("Erreur de chargement des KPIs", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

            {/* Header Fixe */}
            <View style={styles.header}>
                <View style={styles.headerTitleCol}>
                    <Text style={styles.headerCategory}>Forum Entreprises EMSI</Text>
                    <Text style={styles.headerTitle}>Tableau de bord Admin</Text>
                </View>
                <View style={styles.adminBadge}>
                    <MaterialIcons name="admin-panel-settings" size={16} color={COLORS.primary} />
                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* --- CARTES STATISTIQUES --- */}
                <View style={styles.row}>
                    <View style={styles.kpiCard}>
                        <View style={styles.kpiIconBox}>
                            <MaterialIcons name="people-alt" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.kpiValue}>{kpis?.total_students || 0}</Text>
                        <Text style={styles.kpiLabel}>Étudiants inscrits</Text>
                    </View>

                    <View style={styles.kpiCard}>
                        <View style={styles.kpiIconBox}>
                            <MaterialIcons name="description" size={20} color={COLORS.secondary} />
                        </View>
                        <Text style={styles.kpiValue}>{kpis?.total_cvs_dropped || 0}</Text>
                        <Text style={styles.kpiLabel}>CVs déposés</Text>
                    </View>
                </View>

                {/* --- NOTE MOYENNE DE SATISFACTION --- */}
                <View style={styles.kpiCardSingle}>
                    <View style={styles.ratingRow}>
                        <MaterialIcons name="star" size={28} color={COLORS.ratingStar} />
                        <Text style={styles.kpiValueRating}>
                            {typeof kpis?.average_forum_rating === 'number'
                                ? kpis.average_forum_rating.toFixed(1)
                                : kpis?.average_forum_rating || "0.0"
                            }
                            <Text style={styles.ratingMax}> / 5.0</Text>
                        </Text>
                    </View>
                    <Text style={styles.kpiLabelSingle}>Note moyenne de satisfaction du Forum</Text>
                </View>

                {/* --- CLASSEMENT DES ENTREPRISES --- */}
                <View style={styles.rankingSection}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.iconHeaderBox}>
                            <MaterialIcons name="leaderboard" size={20} color={COLORS.primary} />
                        </View>
                        <View style={styles.headerTextCol}>
                            <Text style={styles.sectionTitle}>Stands les plus visités</Text>
                            <Text style={styles.sectionSubtitle}>Top 3 des interactions étudiants</Text>
                        </View>
                    </View>

                    {kpis?.top_enterprises?.map((enterprise: EnterpriseVisits, index: number) => (
                        <View key={enterprise.id || index} style={styles.rankingRow}>
                            <View style={[styles.rankBadge, index === 0 && styles.rankBadgeGold]}>
                                <Text style={styles.rankText}>#{index + 1}</Text>
                            </View>
                            <Text style={styles.enterpriseName} numberOfLines={1}>{enterprise.name}</Text>
                            <View style={styles.visitsBadge}>
                                <MaterialIcons name="visibility" size={14} color={COLORS.secondary} />
                                <Text style={styles.visitsText}>{enterprise.visits} visites</Text>
                            </View>
                        </View>
                    ))}

                    {(!kpis?.top_enterprises || kpis.top_enterprises.length === 0) && (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="bar-chart" size={32} color={COLORS.outline} />
                            <Text style={styles.emptyText}>Aucune donnée de visite enregistrée pour le moment.</Text>
                        </View>
                    )}
                </View>

                {/* --- FORMULAIRE D'ANNONCE INTÉGRÉ --- */}
                <AdminAnnouncementForm />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
    },

    /* Header Fixe */
    header: {
        height: 64,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    headerTitleCol: {
        justifyContent: 'center',
    },
    headerCategory: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        color: COLORS.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    headerTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 17,
        color: COLORS.onSurface,
    },
    adminBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.surfaceContainer,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
    },
    adminBadgeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        color: COLORS.primary,
        letterSpacing: 0.5,
    },

    scrollContent: {
        padding: 16,
        paddingBottom: 40,
        gap: 16,
    },

    /* KPI Cards */
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: COLORS.surfaceContainerLowest,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    kpiIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.surfaceContainer,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    kpiValue: {
        fontFamily: 'Syne-Bold',
        fontSize: 28,
        color: COLORS.onSurface,
    },
    kpiLabel: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
        color: COLORS.onSurfaceVariant,
        marginTop: 2,
        textAlign: 'center',
    },

    /* KPI Single Card (Rating) */
    kpiCardSingle: {
        backgroundColor: COLORS.surfaceContainerLowest,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    kpiValueRating: {
        fontFamily: 'Syne-Bold',
        fontSize: 32,
        color: COLORS.onSurface,
    },
    ratingMax: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: COLORS.outline,
    },
    kpiLabelSingle: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: COLORS.onSurfaceVariant,
        marginTop: 4,
        textAlign: 'center',
    },

    /* Ranking Section */
    rankingSection: {
        backgroundColor: COLORS.surfaceContainerLowest,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    iconHeaderBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.surfaceContainer,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconHeaderBoxAlert: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.tertiaryContainer,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextCol: {
        flex: 1,
    },
    sectionTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 16,
        color: COLORS.onSurface,
    },
    sectionSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: COLORS.onSurfaceVariant,
    },

    rankingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceContainerLow,
        gap: 12,
    },
    rankBadge: {
        backgroundColor: COLORS.surfaceContainerHigh,
        borderRadius: 10,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankBadgeGold: {
        backgroundColor: COLORS.secondaryContainer,
    },
    rankText: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: COLORS.onSurface,
    },
    enterpriseName: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: COLORS.onSurface,
    },
    visitsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.surfaceContainerLow,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    visitsText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: COLORS.secondary,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    emptyText: {
        fontFamily: 'Inter-Regular',
        color: COLORS.outline,
        fontSize: 13,
        textAlign: 'center',
    },

    /* Form Section */
    formCard: {
        backgroundColor: COLORS.surfaceContainerLowest,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    inputGroup: {
        gap: 4,
        marginBottom: 12,
    },
    inputLabel: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        color: COLORS.outline,
        letterSpacing: 0.5,
    },
    input: {
        fontFamily: 'Inter-Regular',
        height: 44,
        borderWidth: 1,
        borderColor: COLORS.surfaceContainerHighest,
        backgroundColor: COLORS.surfaceContainerLow,
        borderRadius: 12,
        paddingHorizontal: 12,
        fontSize: 14,
        color: COLORS.onSurface,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    announceButton: {
        backgroundColor: COLORS.tertiary,
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
        shadowColor: COLORS.tertiary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    announceButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.onPrimary,
        fontSize: 14,
    },
});