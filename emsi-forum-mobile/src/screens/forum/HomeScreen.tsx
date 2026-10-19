import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Modal,
    ActivityIndicator
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/types';
import api from '../../services/api';

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { user, setUser } = useAuthStore();
    const { colors, isDark } = useAppTheme();
    const [qrModalVisible, setQrModalVisible] = useState<boolean>(false);
    const [loadingQr, setLoadingQr] = useState<boolean>(false);

    // Fonction appelée à l'ouverture de la modale pour rafraîchir et récupérer le vrai token depuis l'API
    const handleOpenQrModal = async () => {
        setQrModalVisible(true);
        try {
            setLoadingQr(true);
            // Appel à l'endpoint de profil / ou votre endpoint dédié /my-qr-token
            const response = await api.get('/api/profile/my-qr-token');
            if (response.data) {
                // Met à jour le store local avec le profil complet contenant le qr_code_token
                setUser(response.data);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération du token QR :", error);
        } finally {
            setLoadingQr(false);
        }
    };

    const getQRCodeData = () => {
        if (!user) return 'EMSI-GUEST-SECURE-QR';
        // Utilise le vrai token récupéré de la base de données
        return (user as any).qr_code_token || `EMSI-2026-${user.id}`;
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={colors.surface}
            />

            {/* Header Fixe */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceContainerHighest }]}>
                <View style={styles.headerLeft}>
                    <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
                        <MaterialIcons name="school" size={22} color={colors.onPrimary} />
                    </View>
                    <View style={styles.headerTitleCol}>
                        <Text style={[styles.headerCategory, { color: colors.secondary }]}>
                            Forum Entreprises EMSI
                        </Text>
                        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                            Accueil
                        </Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Settings' as any)}
                    >
                        <MaterialIcons name="settings" size={22} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                        <MaterialIcons name="notifications-none" size={22} color={colors.onSurfaceVariant} />
                        <View style={[styles.notificationDot, { backgroundColor: colors.tertiary, borderColor: colors.surface }]} />
                    </TouchableOpacity>

                    <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
                        <MaterialIcons name="person" size={18} color={colors.onPrimary} />
                    </View>
                </View>
            </View>

            <ScrollView
                style={[styles.container, { backgroundColor: colors.surface }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Strip Localisation & Campus */}
                <View style={styles.locationStrip}>
                    <TouchableOpacity style={[styles.locationBadge, { backgroundColor: colors.surfaceContainerLow }]} activeOpacity={0.8}>
                        <MaterialIcons name="location-on" size={18} color={colors.primary} />
                        <Text style={[styles.locationText, { color: colors.onSurface }]}>
                            Casablanca • Campus Roudani
                        </Text>
                        <MaterialIcons name="keyboard-arrow-down" size={16} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>

                    <View style={[styles.campusStatusBadge, { backgroundColor: colors.secondaryContainer }]}>
                        <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.campusStatusText, { color: colors.onSecondaryContainer }]}>
                            Campus Ouvert
                        </Text>
                    </View>
                </View>

                {/* Hero Banner Direct */}
                <View style={[styles.heroCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                    <View style={styles.heroHeaderRow}>
                        <View style={[styles.liveTag, { backgroundColor: colors.primary }]}>
                            <View style={[styles.liveDot, { backgroundColor: colors.onPrimary }]} />
                            <Text style={[styles.liveTagText, { color: colors.onPrimary }]}>EN DIRECT</Text>
                        </View>
                        <View style={styles.scheduleRow}>
                            <MaterialIcons name="schedule" size={16} color={colors.primary} />
                            <Text style={[styles.scheduleText, { color: colors.onSurfaceVariant }]}>09:00 - 18:00</Text>
                        </View>
                    </View>

                    <View style={styles.heroBody}>
                        <Text style={[styles.heroTitle, { color: colors.onSurface }]}>
                            LE FORUM RECRUTEMENT <Text style={[styles.heroTitleHighlight, { color: colors.primary }]}>EMSI</Text> 2025
                        </Text>
                        <Text style={[styles.heroSubtitle, { color: colors.onSurfaceVariant }]}>
                            12ème Édition Nationale • Plus de 1500 opportunités de stages PFE & carrières d'ingénieurs.
                        </Text>
                    </View>

                    <View style={styles.heroFooter}>
                        <TouchableOpacity
                            style={styles.heroCta}
                            onPress={() => navigation.navigate('MainTabs' as any, { screen: 'Entreprises' })}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.heroCtaText, { color: colors.primary }]}>Voir hall & stands</Text>
                            <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
                        </TouchableOpacity>

                        <View style={styles.domainBadgesRow}>
                            <View style={[styles.domainAvatar, { backgroundColor: colors.secondaryContainer, borderColor: colors.surfaceContainerLowest }]}>
                                <Text style={[styles.domainAvatarText, { color: colors.onSurfaceVariant }]}>AI</Text>
                            </View>
                            <View style={[styles.domainAvatar, { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceContainerLowest }]}>
                                <Text style={[styles.domainAvatarText, { color: colors.onSurfaceVariant }]}>IT</Text>
                            </View>
                            <View style={[styles.domainAvatar, { backgroundColor: colors.surfaceContainerHighest, borderColor: colors.surfaceContainerLowest }]}>
                                <Text style={[styles.domainAvatarText, { color: colors.onSurfaceVariant }]}>GC</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats Counters Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                        <View style={[styles.statIconBox, { backgroundColor: colors.surfaceContainer }]}>
                            <MaterialIcons name="business" size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.statValuePrimary, { color: colors.primary }]}>120+</Text>
                        <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Entreprises Partenaires</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                        <View style={[styles.statIconBox, { backgroundColor: colors.surfaceContainer }]}>
                            <MaterialIcons name="school" size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.statValueDark, { color: colors.onSurface }]}>3500+</Text>
                        <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Étudiants Ingénieurs</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                        <View style={[styles.statIconBox, { backgroundColor: colors.surfaceContainer }]}>
                            <MaterialIcons name="work" size={18} color={colors.tertiary} />
                        </View>
                        <Text style={[styles.statValueTertiary, { color: colors.tertiary }]}>450+</Text>
                        <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Offres PFE & Jobs</Text>
                    </View>
                </View>

                {/* Accès Rapides (2x2 Grid) */}
                <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.titleWithIcon}>
                            <MaterialIcons name="bolt" size={20} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Accès Rapides</Text>
                        </View>
                        <Text style={[styles.sectionCategory, { color: colors.onSurfaceVariant }]}>Services Campus</Text>
                    </View>

                    <View style={styles.quickAccessGrid}>
                        {/* Card 1: Pass Badge - Déclenche handleOpenQrModal */}
                        <TouchableOpacity
                            style={[styles.quickCard, { backgroundColor: colors.surfaceContainerLowest }]}
                            onPress={handleOpenQrModal}
                            activeOpacity={0.8}
                        >
                            <View style={styles.quickCardTop}>
                                <View style={[styles.quickIconBox, { backgroundColor: colors.surfaceContainer }]}>
                                    <MaterialIcons name="badge" size={22} color={colors.primary} />
                                </View>
                                <MaterialIcons name="north-east" size={18} color={colors.outline} />
                            </View>
                            <View>
                                <Text style={[styles.quickCardTitle, { color: colors.onSurface }]}>Mon Pass Badge</Text>
                                <Text style={[styles.quickCardSubPrimary, { color: colors.secondary }]}>Accrédité PFE 2027</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Card 2: Speed Job Dating */}
                        <TouchableOpacity
                            style={[styles.quickCard, { backgroundColor: colors.surfaceContainerLowest }]}
                            onPress={() => navigation.navigate('Announcements' as any)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.quickCardTop}>
                                <View style={[styles.quickIconBox, { backgroundColor: colors.tertiaryFixed }]}>
                                    <MaterialIcons name="flash-on" size={22} color={colors.tertiary} />
                                </View>
                                <View style={[styles.openBadge, { backgroundColor: colors.tertiary }]}>
                                    <Text style={[styles.openBadgeText, { color: colors.onPrimary }]}>OUVERT</Text>
                                </View>
                            </View>
                            <View>
                                <Text style={[styles.quickCardTitle, { color: colors.onSurface }]}>Speed Dating</Text>
                                <Text style={[styles.quickCardSubTertiary, { color: colors.tertiary }]}>Créneau : 14h00</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Card 3: Programme */}
                        <TouchableOpacity
                            style={[styles.quickCard, { backgroundColor: colors.surfaceContainerLowest }]}
                            onPress={() => navigation.navigate('Announcements' as any)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.quickCardTop}>
                                <View style={[styles.quickIconBox, { backgroundColor: colors.surfaceContainer }]}>
                                    <MaterialIcons name="event-note" size={22} color={colors.onSurfaceVariant} />
                                </View>
                                <View style={[styles.countBadge, { backgroundColor: colors.surfaceContainer }]}>
                                    <Text style={[styles.countBadgeText, { color: colors.onSurfaceVariant }]}>6 Sessions</Text>
                                </View>
                            </View>
                            <View>
                                <Text style={[styles.quickCardTitle, { color: colors.onSurface }]}>Programme</Text>
                                <Text style={[styles.quickCardSub, { color: colors.onSurfaceVariant }]}>Timeline interactive</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Card 4: Coaching CV */}
                        <TouchableOpacity
                            style={[styles.quickCard, { backgroundColor: colors.surfaceContainerLowest }]}
                            onPress={() => navigation.navigate('MainTabs' as any, { screen: 'Profil' })}
                            activeOpacity={0.8}
                        >
                            <View style={styles.quickCardTop}>
                                <View style={[styles.quickIconBox, { backgroundColor: colors.surfaceContainer }]}>
                                    <MaterialIcons name="rate-review" size={22} color={colors.onSurfaceVariant} />
                                </View>
                                <View style={[styles.countBadge, { backgroundColor: colors.surfaceContainer }]}>
                                    <Text style={[styles.countBadgeText, { color: colors.secondary }]}>Lab RH</Text>
                                </View>
                            </View>
                            <View>
                                <Text style={[styles.quickCardTitle, { color: colors.onSurface }]}>Coaching CV</Text>
                                <Text style={[styles.quickCardSub, { color: colors.onSurfaceVariant }]}>Revue individuelle</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Highlight / Keynote Section */}
                <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.titleWithIcon}>
                            <View style={[styles.pingDot, { backgroundColor: colors.tertiary }]} />
                            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>À la une en ce moment</Text>
                        </View>
                        <View style={[styles.liveTagHeader, { backgroundColor: colors.tertiaryFixed }]}>
                            <Text style={[styles.liveTagHeaderText, { color: colors.onTertiaryFixedVariant }]}>EN DIRECT</Text>
                        </View>
                    </View>

                    {/* Keynote Card */}
                    <View style={[styles.keynoteCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                        <View style={styles.keynoteMetaRow}>
                            <View style={styles.tagGroup}>
                                <View style={[styles.tagItem, { backgroundColor: colors.surfaceContainerHigh }]}>
                                    <Text style={[styles.tagItemText, { color: colors.onSurfaceVariant }]}>Keynote Majeure</Text>
                                </View>
                                <View style={[styles.tagItemSecondary, { backgroundColor: colors.secondaryContainer }]}>
                                    <MaterialIcons name="timer" size={14} color={colors.onSecondaryContainer} />
                                    <Text style={[styles.tagItemSecondaryText, { color: colors.onSecondaryContainer }]}>10:30 - 11:45</Text>
                                </View>
                            </View>
                            <View style={[styles.amphiBadge, { backgroundColor: colors.tertiaryFixed }]}>
                                <Text style={[styles.amphiBadgeText, { color: colors.tertiary }]}>Amphi A</Text>
                            </View>
                        </View>

                        <View style={styles.keynoteBody}>
                            <Text style={[styles.keynoteTitle, { color: colors.onSurface }]}>
                                L'Intelligence Artificielle Générative dans l'Ingénierie de Demain
                            </Text>
                            <View style={styles.speakerRow}>
                                <MaterialIcons name="groups" size={16} color={colors.primary} />
                                <Text style={[styles.speakerText, { color: colors.onSurfaceVariant }]}>
                                    Intervenants : <Text style={[styles.boldText, { color: colors.onSurface }]}>AWS</Text> & <Text style={[styles.boldText, { color: colors.onSurface }]}>Capgemini Maroc</Text>
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.keynoteFooter, { borderTopColor: colors.surfaceContainerHighest }]}>
                            <View style={styles.speakerInfo}>
                                <View style={[styles.voiceIconBox, { backgroundColor: colors.surfaceContainer }]}>
                                    <MaterialIcons name="record-voice-over" size={18} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.placesText, { color: colors.onSurface }]}>240 places restantes</Text>
                                    <Text style={[styles.accessText, { color: colors.secondary }]}>Accès libre aux 4A & 5A</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.joinButton, { backgroundColor: colors.primary }]}
                                onPress={() => navigation.navigate('Announcements' as any)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.joinButtonText, { color: colors.onPrimary }]}>Rejoindre</Text>
                                <MaterialIcons name="arrow-forward" size={16} color={colors.onPrimary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Fast-Check QR Card - Déclenche handleOpenQrModal */}
                <TouchableOpacity
                    style={[styles.qrCheckCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest }]}
                    onPress={handleOpenQrModal}
                    activeOpacity={0.85}
                >
                    <View style={styles.qrCardLeft}>
                        <View style={[styles.qrIconBox, { backgroundColor: colors.primary }]}>
                            <MaterialIcons name="qr-code-2" size={26} color={colors.onPrimary} />
                        </View>
                        <View style={styles.qrTextCol}>
                            <Text style={[styles.qrTag, { color: colors.primary }]}>Fast-Check Recruteur</Text>
                            <Text style={[styles.qrTitle, { color: colors.onSurface }]}>Présenter le badge QR Forum</Text>
                            <Text style={[styles.qrSubtitle, { color: colors.onSurfaceVariant }]}>CV numérique synchronisé avec votre profil</Text>
                        </View>
                    </View>
                    <View style={[styles.qrExpandBtn, { backgroundColor: colors.surfaceContainerLowest }]}>
                        <MaterialIcons name="fullscreen" size={20} color={colors.onSurface} />
                    </View>
                </TouchableOpacity>

            </ScrollView>

            {/* Modal Student Pass / QR Code Unique */}
            <Modal
                visible={qrModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setQrModalVisible(false)}
            >
                <TouchableOpacity
                    style={[styles.modalOverlay, { backgroundColor: colors.inverseSurface }]}
                    activeOpacity={1}
                    onPress={() => setQrModalVisible(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={[styles.modalContentCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                        <View style={[styles.modalHeaderBox, { backgroundColor: colors.primary }]}>
                            <TouchableOpacity
                                style={styles.modalCloseIconBtn}
                                onPress={() => setQrModalVisible(false)}
                            >
                                <MaterialIcons name="close" size={18} color={colors.onPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.modalPassTag}>PASS ÉTUDIANT INSTANTANÉ</Text>
                            <Text style={[styles.modalOwnerName, { color: colors.onPrimary }]}>
                                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Élève Ingénieur EMSI'}
                            </Text>
                            <Text style={[styles.modalOwnerSubtitle, { color: colors.onPrimary }]}>
                                EMSI Casablanca • Campus Roudani
                            </Text>
                        </View>

                        <View style={styles.modalBody}>
                            {loadingQr ? (
                                <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={[styles.qrScanInstructions, { color: colors.onSurfaceVariant, marginTop: 12 }]}>
                                        Chargement de votre pass sécurisé...
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <View style={[styles.qrCodeWrapper, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.surfaceContainer }]}>
                                        <QRCode
                                            value={getQRCodeData()}
                                            size={180}
                                            color={colors.onSurface}
                                            backgroundColor={colors.surfaceContainerLowest}
                                        />
                                    </View>
                                    <Text style={[styles.qrScanInstructions, { color: colors.onSurfaceVariant }]}>
                                        Faites scanner ce code par un administrateur ou recruteur pour valider votre présence et transmettre votre CV.
                                    </Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
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
        gap: 16,
    },
    header: {
        height: 64,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 2,
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        gap: 4,
    },
    locationText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    campusStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        gap: 6,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    campusStatusText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
    },
    heroCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        gap: 12,
    },
    heroHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 9999,
        gap: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    liveTagText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        letterSpacing: 0.5,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    scheduleText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    heroBody: {
        gap: 4,
    },
    heroTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 22,
        lineHeight: 28,
    },
    heroTitleHighlight: {
        fontFamily: 'Syne-ExtraBold',
    },
    heroSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        lineHeight: 18,
    },
    heroFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 4,
    },
    heroCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    heroCtaText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
    domainBadgesRow: {
        flexDirection: 'row',
        gap: -6,
    },
    domainAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    domainAvatarText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    statIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    statValuePrimary: {
        fontFamily: 'Syne-Bold',
        fontSize: 18,
    },
    statValueDark: {
        fontFamily: 'Syne-Bold',
        fontSize: 18,
    },
    statValueTertiary: {
        fontFamily: 'Syne-Bold',
        fontSize: 18,
    },
    statLabel: {
        fontFamily: 'Inter-Regular',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
    },
    sectionBlock: {
        gap: 12,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    sectionTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 16,
    },
    sectionCategory: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    liveTagHeader: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 9999,
    },
    liveTagHeaderText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
    },
    quickAccessGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    quickCard: {
        width: '48.5%',
        height: 120,
        borderRadius: 16,
        padding: 14,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    quickCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    quickIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    openBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 9999,
    },
    openBadgeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 8,
    },
    countBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 9999,
    },
    countBadgeText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 9,
    },
    quickCardTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
    quickCardSub: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
    },
    quickCardSubPrimary: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
    },
    quickCardSubTertiary: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
    },
    keynoteCard: {
        borderRadius: 16,
        padding: 18,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    keynoteMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tagGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tagItem: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 9999,
    },
    tagItemText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 10,
    },
    tagItemSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 9999,
    },
    tagItemSecondaryText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 10,
    },
    amphiBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 9999,
    },
    amphiBadgeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
    },
    keynoteBody: {
        gap: 6,
    },
    keynoteTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 16,
        lineHeight: 22,
    },
    speakerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    speakerText: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
    },
    boldText: {
        fontFamily: 'Inter-Bold',
    },
    keynoteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
    },
    speakerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    voiceIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placesText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
    },
    accessText: {
        fontFamily: 'Inter-Regular',
        fontSize: 10,
    },
    joinButton: {
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    joinButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
    },
    qrCheckCard: {
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    qrCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    qrIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrTextCol: {
        flex: 1,
    },
    qrTag: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    qrTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
    qrSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
    },
    qrExpandBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 16,
    },
    modalContentCard: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 10,
    },
    modalHeaderBox: {
        padding: 16,
        position: 'relative',
    },
    modalCloseIconBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalPassTag: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        color: '#8afaa4',
        textTransform: 'uppercase',
    },
    modalOwnerName: {
        fontFamily: 'Syne-Bold',
        fontSize: 17,
        marginTop: 4,
    },
    modalOwnerSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        opacity: 0.8,
    },
    modalBody: {
        padding: 24,
        alignItems: 'center',
    },
    qrCodeWrapper: {
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 2,
    },
    qrScanInstructions: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
    },
});