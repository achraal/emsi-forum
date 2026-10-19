import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ListRenderItem,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import api from '../../services/api';
import { useAppTheme } from '../../context/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

export interface Announcement {
    id: number | string;
    title: string;
    message: string;
    created_at: string;
    [key: string]: any;
}

type Props = NativeStackScreenProps<
    RootStackParamList,
    'Announcements'
>;

export default function AnnouncementsScreen({ navigation }: Props) {
    const { colors, isDark } = useAppTheme();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // Fonction de récupération des annonces
    const fetchAnnouncements = async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setRefreshing(true);
        }
        try {
            const response = await api.get<Announcement[]>('/api/announcements/');
            setAnnouncements(response.data);
        } catch (err) {
            console.log("Erreur de chargement des annonces :", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // `useFocusEffect` recharge les données à CHAQUE FOIS que l'écran devient actif
    useFocusEffect(
        useCallback(() => {
            fetchAnnouncements();
        }, [])
    );

    // Gestion du tirage vers le bas (Pull-to-Refresh)
    const onRefresh = () => {
        fetchAnnouncements(true);
    };

    const renderItem: ListRenderItem<Announcement> = ({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainer }]}>
                    <MaterialIcons name="campaign" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.primary }]} numberOfLines={2}>
                    {item.title}
                </Text>
            </View>

            <Text style={[styles.message, { color: colors.onSurface }]}>
                {item.message}
            </Text>

            <View style={[styles.cardFooter, { borderTopColor: colors.surfaceContainerLow }]}>
                <MaterialIcons name="access-time" size={14} color={colors.outline} />
                <Text style={[styles.date, { color: colors.outline }]}>
                    {item.created_at ? new Date(item.created_at).toLocaleString('fr-FR') : ''}
                </Text>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
                <View style={[styles.centered, { backgroundColor: colors.surface }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={colors.surface}
            />

            {/* Header Fixe avec Bouton Retour */}
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
                        Annonces Officielles
                    </Text>
                </View>
            </View>

            <View style={[styles.container, { backgroundColor: colors.surface }]}>
                <FlatList
                    data={announcements}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="notifications-none" size={48} color={colors.outline} />
                            <Text style={[styles.emptyText, { color: colors.outline }]}>
                                Aucune annonce pour le moment.
                            </Text>
                        </View>
                    }
                />
            </View>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Header Fixe */
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

    /* Liste & Cards */
    list: {
        padding: 16,
        gap: 12,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        flex: 1,
    },
    message: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        borderTopWidth: 1,
        paddingTop: 8,
    },
    date: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
    },

    /* Empty state */
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 12,
    },
    emptyText: {
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        fontSize: 14,
    },
});