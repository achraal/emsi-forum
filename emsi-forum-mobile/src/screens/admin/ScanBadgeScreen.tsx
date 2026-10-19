import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    TextInput,
    ActivityIndicator,
    Modal,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../context/ThemeContext';
import api from '../../services/api';

export default function ScanBadgeScreen() {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { colors, isDark } = useAppTheme();

    const isAdmin = user?.role === 'admin';

    // États pour le mode étudiant
    const [isMaxBrightness, setIsMaxBrightness] = useState<boolean>(false);
    const [lastUpdated, setLastUpdated] = useState<string>('il y a 2 min');
    const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

    // États pour le mode Admin / Recruteur (Caméra, Scanner, Recherche & Historique)
    const [manualTokenInput, setManualTokenInput] = useState<string>('');
    const [searchEmailQuery, setSearchEmailQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchingEmail, setSearchingEmail] = useState<boolean>(false);

    const [scanning, setScanning] = useState<boolean>(false);
    const [scannedStudent, setScannedStudent] = useState<any>(null);
    const [scannedHistory, setScannedHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
    const [cameraModalVisible, setCameraModalVisible] = useState<boolean>(false);
    const [permission, requestPermission] = useCameraPermissions();

    // Verrou synchrone anti-double scan instantané
    const isScanningRef = useRef<boolean>(false);

    // Charger l'historique des scans au démarrage pour l'admin/recruteur
    useEffect(() => {
        if (isAdmin) {
            fetchMyScans();
        }
    }, [isAdmin]);

    // Fonction de recherche rapide par email avec debounce léger ou saisie directe
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchEmailQuery.trim().length > 1) {
                try {
                    setSearchingEmail(true);
                    const response = await api.get(`/api/badge/search-student?email=${encodeURIComponent(searchEmailQuery.trim())}`);
                    setSearchResults(response.data);
                } catch (error) {
                    console.error("Erreur lors de la recherche par email :", error);
                } finally {
                    setSearchingEmail(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchEmailQuery]);

    const fetchMyScans = async () => {
        try {
            setLoadingHistory(true);
            const response = await api.get('/api/badge/my-scans');
            setScannedHistory(response.data);
        } catch (error) {
            console.error("Erreur lors du chargement de l'historique des scans :", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const getQRCodeToken = () => {
        if (!user) return 'EMSI-SECURE-QR';
        return (user as any).qr_code_token || `EMSI-2026-${user.id}`;
    };

    const handleToggleBrightness = () => {
        setIsMaxBrightness(!isMaxBrightness);
    };

    const handleRegenerate = () => {
        setIsRegenerating(true);
        setTimeout(() => {
            setLastUpdated("à l'instant");
            setIsRegenerating(false);
        }, 400);
    };

    const handleOpenCameraController = async () => {
        if (!permission || !permission.granted) {
            const permResult = await requestPermission();
            if (!permResult.granted) {
                Alert.alert('Permission requise', "L'accès à la caméra est nécessaire pour scanner les badges.");
                return;
            }
        }
        isScanningRef.current = false;
        setCameraModalVisible(true);
    };

    const handleValidateScan = async (tokenToVerify?: string) => {
        const token = tokenToVerify || manualTokenInput.trim();
        if (!token) {
            Alert.alert('Erreur', 'Veuillez scanner un QR code ou saisir un token.');
            return;
        }

        if (isScanningRef.current) return;
        isScanningRef.current = true;

        setCameraModalVisible(false);

        try {
            setScanning(true);

            const response = await api.post('/api/badge/scan', {
                qr_token: token,
                location: 'Forum EMSI Casablanca'
            });

            setScannedStudent(response.data.student);
            Alert.alert('Succès', `Badge validé pour ${response.data.student.first_name} ${response.data.student.last_name} !`);
            setManualTokenInput('');
            setSearchEmailQuery('');
            setSearchResults([]);

            fetchMyScans();
        } catch (error: any) {
            console.error("Erreur de scan :", error);
            Alert.alert('Erreur', error.response?.data?.detail || 'Badge invalide ou étudiant introuvable.', [
                { text: 'OK', onPress: () => { isScanningRef.current = false; } }
            ]);
        } finally {
            setScanning(false);
        }
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (data && !isScanningRef.current) {
            handleValidateScan(data);
        }
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
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: colors.surfaceContainerLow }]}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleCol}>
                        <Text style={[styles.headerCategory, { color: colors.secondary }]}>Forum Entreprises EMSI</Text>
                        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                            {isAdmin ? 'Contrôle & Scan Badge' : 'Mon Pass Badge'}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <View style={[styles.activeTag, { backgroundColor: colors.secondaryContainer }]}>
                        <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.activeTagText, { color: colors.onSecondaryContainer }]}>Actif</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={[styles.container, { backgroundColor: colors.surface }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {isAdmin ? (
                    <View style={{ gap: 16 }}>
                        <View style={styles.introBlock}>
                            <View style={[styles.eventBadge, { backgroundColor: colors.surfaceContainerHigh }]}>
                                <MaterialIcons name="admin-panel-settings" size={16} color={colors.primary} />
                                <Text style={[styles.eventBadgeText, { color: colors.primary }]}>Interface Recruteur & Admin</Text>
                            </View>
                            <Text style={[styles.mainTitle, { color: colors.onSurface }]}>Validation des Pass Étudiants</Text>
                            <Text style={[styles.mainSubtitle, { color: colors.onSurfaceVariant }]}>
                                Scannez le QR code, saisissez le token ou recherchez par email.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.cameraLauncherBtn, { backgroundColor: colors.primary }]}
                            onPress={handleOpenCameraController}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="qr-code-scanner" size={24} color={colors.onPrimary} />
                            <Text style={[styles.cameraLauncherText, { color: colors.onPrimary }]}>Ouvrir le Scanner Caméra</Text>
                        </TouchableOpacity>

                        {/* NOUVELLE SECTION : Recherche Rapide par Email */}
                        <View style={[styles.badgeCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Recherche Rapide par Email</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                    placeholder="Ex: chaimaa.lahlou@emsi-edu.ma..."
                                    placeholderTextColor={colors.outline}
                                    value={searchEmailQuery}
                                    onChangeText={setSearchEmailQuery}
                                    autoCapitalize="none"
                                />
                                {searchingEmail && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: -35 }} />}
                            </View>

                            {/* Liste des résultats de recherche rapide */}
                            {searchResults.length > 0 && (
                                <View style={[styles.searchResultsBox, { borderColor: colors.surfaceContainerHighest }]}>
                                    {searchResults.map((student) => (
                                        <TouchableOpacity
                                            key={student.id}
                                            style={[styles.searchResultItem, { borderBottomColor: colors.surfaceContainerHighest }]}
                                            onPress={() => {
                                                if (student.qr_code_token) {
                                                    handleValidateScan(student.qr_code_token);
                                                } else {
                                                    Alert.alert('Erreur', "Cet étudiant n'a pas de token QR valide en base.");
                                                }
                                            }}
                                        >
                                            <View>
                                                <Text style={[styles.searchResultName, { color: colors.onSurface }]}>
                                                    {student.first_name} {student.last_name}
                                                </Text>
                                                <Text style={[styles.searchResultEmail, { color: colors.onSurfaceVariant }]}>
                                                    {student.email}
                                                </Text>
                                            </View>
                                            <View style={[styles.miniScanBtn, { backgroundColor: colors.primary }]}>
                                                <MaterialIcons name="check" size={16} color={colors.onPrimary} />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Saisie manuelle de token */}
                        <View style={[styles.badgeCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Ou Saisir le Token Manuellement</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                    placeholder="Ex: EMSI-2026-xxxx..."
                                    placeholderTextColor={colors.outline}
                                    value={manualTokenInput}
                                    onChangeText={setManualTokenInput}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={[styles.scanBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => handleValidateScan()}
                                    disabled={scanning}
                                >
                                    {scanning ? (
                                        <ActivityIndicator color={colors.onPrimary} size="small" />
                                    ) : (
                                        <MaterialIcons name="check" size={20} color={colors.onPrimary} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Résultat du dernier étudiant scanné */}
                        {scannedStudent && (
                            <View style={[styles.badgeCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.primary, borderWidth: 1 }]}>
                                <View style={styles.resultHeader}>
                                    <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                                    <Text style={[styles.resultTitle, { color: colors.onSurface }]}>Dernier Étudiant Validé</Text>
                                </View>
                                <Text style={[styles.studentNameText, { color: colors.onSurface }]}>
                                    {scannedStudent.first_name} {scannedStudent.last_name}
                                </Text>
                                <Text style={[styles.studentMetaText, { color: colors.onSurfaceVariant }]}>
                                    Email : {scannedStudent.email}
                                </Text>
                                <Text style={[styles.studentMetaText, { color: colors.onSurfaceVariant }]}>
                                    Filière : {scannedStudent.filiere || 'Non renseigné'} • Campus : {scannedStudent.site || 'Casablanca'}
                                </Text>
                                {scannedStudent.cv_url && (
                                    <TouchableOpacity
                                        style={[styles.cvLinkBtn, { backgroundColor: colors.secondaryContainer }]}
                                        onPress={() => Alert.alert('CV', `Lien du CV : ${scannedStudent.cv_url}`)}
                                    >
                                        <MaterialIcons name="picture-as-pdf" size={16} color={colors.onSecondaryContainer} />
                                        <Text style={[styles.cvLinkText, { color: colors.onSecondaryContainer }]}>Consulter le CV PDF</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Historique des étudiants scannés (/my-scans) */}
                        <View style={[styles.badgeCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                            <View style={styles.historyHeaderRow}>
                                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Historique de mes Scans</Text>
                                <TouchableOpacity onPress={fetchMyScans}>
                                    <MaterialIcons name="refresh" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>

                            {loadingHistory ? (
                                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                            ) : scannedHistory.length === 0 ? (
                                <Text style={[styles.emptyHistoryText, { color: colors.onSurfaceVariant }]}>
                                    Aucun badge scanné pour le moment.
                                </Text>
                            ) : (
                                scannedHistory.map((scan, index) => (
                                    <View key={index} style={[styles.historyItem, { borderBottomColor: colors.surfaceContainerHighest }]}>
                                        <View style={styles.historyInfo}>
                                            <Text style={[styles.historyEmail, { color: colors.onSurface }]}>{scan.student_email}</Text>
                                            <Text style={[styles.historyDate, { color: colors.onSurfaceVariant }]}>
                                                {new Date(scan.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {scan.location || 'Forum EMSI'}
                                            </Text>
                                        </View>
                                        <MaterialIcons name="check-circle" size={18} color={colors.primary} />
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={styles.introBlock}>
                            <View style={[styles.eventBadge, { backgroundColor: colors.surfaceContainerHigh }]}>
                                <MaterialIcons name="verified-user" size={16} color={colors.primary} />
                                <Text style={[styles.eventBadgeText, { color: colors.primary }]}>Forum Entreprises EMSI</Text>
                            </View>
                            <Text style={[styles.mainTitle, { color: colors.onSurface }]}>Pass Événementiel & Accréditation</Text>
                            <Text style={[styles.mainSubtitle, { color: colors.onSurfaceVariant }]}>
                                Accès prioritaire aux stands & fast-track recruteurs
                            </Text>
                        </View>

                        <View style={[styles.badgeCard, { backgroundColor: colors.surfaceContainerLowest }, isMaxBrightness && styles.badgeCardMaxBrightness]}>
                            <View style={styles.badgeCardHeader}>
                                <View style={[styles.shieldBadge, { backgroundColor: colors.surfaceContainer }]}>
                                    <MaterialIcons name="shield" size={14} color={colors.primary} />
                                    <Text style={[styles.shieldBadgeText, { color: colors.onSurface }]}>Badge Sécurisé EMSI v2026</Text>
                                </View>
                                <View style={[styles.nfcBadge, { backgroundColor: colors.secondaryContainer }]}>
                                    <MaterialIcons name="contactless" size={14} color={colors.onSecondaryContainer} />
                                    <Text style={[styles.nfcBadgeText, { color: colors.onSecondaryContainer }]}>NFC Actif</Text>
                                </View>
                            </View>

                            <View style={styles.qrWrapperContainer}>
                                <View style={[styles.qrBox, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.surfaceContainer }, isMaxBrightness && styles.qrBoxMaxBrightness]}>
                                    <QRCode
                                        value={getQRCodeToken()}
                                        size={200}
                                        color={colors.onSurface}
                                        backgroundColor={colors.surfaceContainerLowest}
                                    />
                                </View>
                            </View>

                            <View style={[styles.tokenPill, { backgroundColor: colors.surfaceContainer }]}>
                                <MaterialIcons name="key" size={16} color={colors.primary} />
                                <Text style={[styles.tokenText, { color: colors.onSurface }]}>
                                    TOKEN: <Text style={styles.boldText}>{getQRCodeToken()}</Text>
                                </Text>
                            </View>

                            <View style={styles.validityRow}>
                                <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
                                <Text style={[styles.validityText, { color: colors.onSurfaceVariant }]}>
                                    Valide pour le salon • Actualisé {lastUpdated}
                                </Text>
                            </View>

                            <View style={[styles.badgeCardFooter, { borderTopColor: colors.surfaceContainerHighest }]}>
                                <TouchableOpacity style={styles.controlButton} onPress={handleToggleBrightness} activeOpacity={0.7}>
                                    <MaterialIcons name="brightness-high" size={18} color={colors.secondary} />
                                    <Text style={[styles.controlButtonText, { color: colors.onSurfaceVariant }]}>
                                        {isMaxBrightness ? 'Luminosité normale' : 'Luminosité max'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.controlButtonPrimary} onPress={handleRegenerate} activeOpacity={0.7}>
                                    <MaterialIcons
                                        name="sync"
                                        size={18}
                                        color={colors.primary}
                                        style={isRegenerating ? styles.rotatingIcon : undefined}
                                    />
                                    <Text style={[styles.controlButtonPrimaryText, { color: colors.primary }]}>Régénérer</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

            </ScrollView>

            {/* Modal de la Caméra Scanner */}
            <Modal
                visible={cameraModalVisible}
                animationType="slide"
                onRequestClose={() => setCameraModalVisible(false)}
            >
                <View style={styles.cameraContainer}>
                    {cameraModalVisible && (
                        <CameraView
                            style={StyleSheet.absoluteFill}
                            facing="back"
                            onBarcodeScanned={(scanning || isScanningRef.current) ? undefined : handleBarCodeScanned}
                            barcodeScannerSettings={{
                                barcodeTypes: ["qr"],
                            }}
                        />
                    )}

                    <SafeAreaView style={styles.cameraOverlay}>
                        <View style={styles.cameraHeader}>
                            <TouchableOpacity
                                style={styles.closeCameraBtn}
                                onPress={() => setCameraModalVisible(false)}
                            >
                                <MaterialIcons name="close" size={24} color="#ffffff" />
                            </TouchableOpacity>
                            <Text style={styles.cameraTitle}>Scannez le badge étudiant</Text>
                        </View>

                        <View style={styles.scanTargetBox} />

                        <View style={styles.cameraFooter}>
                            <Text style={styles.cameraFooterText}>
                                Positionnez le QR code de l'étudiant dans le cadre pour le valider.
                            </Text>
                        </View>
                    </SafeAreaView>
                </View>
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    activeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        gap: 6,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    activeTagText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
    },
    introBlock: {
        marginTop: 8,
        gap: 6,
    },
    eventBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        gap: 6,
    },
    eventBadgeText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    mainTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 24,
        letterSpacing: -0.5,
    },
    mainSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
    },
    cameraLauncherBtn: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        elevation: 3,
    },
    cameraLauncherText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
    },
    badgeCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        gap: 16,
    },
    badgeCardMaxBrightness: {
        shadowOpacity: 0.25,
        elevation: 8,
    },
    badgeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    shieldBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        gap: 6,
    },
    shieldBadgeText: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
    },
    nfcBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        gap: 6,
    },
    nfcBadgeText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
    },
    qrWrapperContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    qrBox: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 2,
    },
    qrBoxMaxBrightness: {
        borderWidth: 2,
        backgroundColor: '#ffffff',
    },
    tokenPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 9999,
        gap: 6,
    },
    tokenText: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
    },
    boldText: {
        fontFamily: 'Inter-Bold',
    },
    validityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    validityText: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
    },
    badgeCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    controlButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    controlButtonPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    controlButtonPrimaryText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    rotatingIcon: {
        transform: [{ rotate: '180deg' }],
    },
    sectionTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 15,
        marginBottom: 8,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },
    scanBtn: {
        width: 48,
        height: 48,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResultsBox: {
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 4,
        overflow: 'hidden',
    },
    searchResultItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
    },
    searchResultName: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
    searchResultEmail: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
    },
    miniScanBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    resultTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 16,
    },
    studentNameText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        marginTop: 4,
    },
    studentMetaText: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        marginTop: 2,
    },
    cvLinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 12,
        gap: 6,
    },
    cvLinkText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
    historyHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    emptyHistoryText: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        textAlign: 'center',
        marginVertical: 10,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    historyInfo: {
        gap: 2,
    },
    historyEmail: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
    historyDate: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    cameraOverlay: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 24,
    },
    cameraHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    closeCameraBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 18,
        color: '#ffffff',
    },
    scanTargetBox: {
        width: 240,
        height: 240,
        borderWidth: 2,
        borderColor: '#008740',
        borderRadius: 24,
        alignSelf: 'center',
        backgroundColor: 'transparent',
    },
    cameraFooter: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    cameraFooterText: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: '#ffffff',
        textAlign: 'center',
        opacity: 0.8,
    },
});