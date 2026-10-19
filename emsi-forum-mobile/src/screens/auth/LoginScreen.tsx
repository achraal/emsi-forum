import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    SafeAreaView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

import api from '../../services/api';
import { useAuthStore, User } from '../../store/authStore';
import { RootStackParamList } from '../../navigation/types';
import ForgotPasswordModal from './ForgotPasswordModal';

// Palette de couleurs extraite de la configuration Tailwind
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
    onSurface: '#171d19',
    onSurfaceVariant: '#3e4a3f',
    outline: '#6e7a6e',
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const setToken = useAuthStore(state => state.setToken);
    const setUser = useAuthStore(state => state.setUser);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Champs requis', 'Veuillez saisir votre adresse email et votre mot de passe.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', email.trim());
            formData.append('password', password);

            const response = await api.post<{ access_token: string; user?: User }>('/api/auth/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { access_token, user } = response.data;

            await setToken(access_token);

            let userData = user;
            if (!userData) {
                const profileRes = await api.get<User>('/api/profile/', {
                    headers: { Authorization: `Bearer ${access_token}` }
                });
                userData = profileRes.data;
            }

            setUser(userData);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

        } catch (error: any) {
            console.error("Erreur de connexion :", error);
            Alert.alert('Échec de connexion', 'Adresse email ou mot de passe incorrect.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >

                        {/* En-tête / Branding */}
                        <View style={styles.headerContainer}>
                            {/* Badge Édition */}
                            <View style={styles.editionBadge}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.editionBadgeText}>ÉDITION CARRIÈRE 2025</Text>
                            </View>

                            {/* Block Logo EMSI */}
                            <View style={styles.logoRow}>
                                <View style={styles.logoBox}>
                                    <MaterialIcons name="school" size={24} color={COLORS.onPrimary} />
                                </View>
                                <View style={styles.logoTextCol}>
                                    <Text style={styles.logoTitle}>EMSI</Text>
                                    <Text style={styles.logoSubtitle}>ÉCOLE D'INGÉNIERIE</Text>
                                </View>
                            </View>

                            <Text style={styles.mainTitle}>Forum EMSI 2025</Text>
                            <Text style={styles.mainSubtitle}>
                                Identifiants Campus Ingénieurs • Direction des Systèmes d'Information
                            </Text>
                        </View>

                        {/* Carte Formulaire */}
                        <View style={styles.card}>

                            {/* Champ Email */}
                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>EMAIL ACADÉMIQUE</Text>
                                    <View style={styles.badgeConnect}>
                                        <Text style={styles.badgeConnectText}>EMSI Connect</Text>
                                    </View>
                                </View>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcons name="alternate-email" size={20} color={COLORS.outline} style={styles.inputIconLeft} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="etudiant@emsi-edu.ma"
                                        placeholderTextColor={COLORS.outline}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={email}
                                        onChangeText={setEmail}
                                    />
                                </View>
                            </View>

                            {/* Champ Mot de passe */}
                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>MOT DE PASSE</Text>
                                    <TouchableOpacity activeOpacity={0.7} onPress={() => setForgotModalVisible(true)}>
                                        <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                                    </TouchableOpacity>

                                    <ForgotPasswordModal
                                        visible={forgotModalVisible}
                                        onClose={() => setForgotModalVisible(false)}
                                    />
                                </View>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcons name="lock-outline" size={20} color={COLORS.outline} style={styles.inputIconLeft} />
                                    <TextInput
                                        style={[styles.input, styles.inputWithRightIcon]}
                                        placeholder="••••••••••••"
                                        placeholderTextColor={COLORS.outline}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.inputIconRight}
                                        onPress={() => setShowPassword(!showPassword)}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialIcons
                                            name={showPassword ? "visibility-off" : "visibility"}
                                            size={20}
                                            color={COLORS.outline}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Bouton de Connexion */}
                            <TouchableOpacity
                                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.onPrimary} />
                                ) : (
                                    <>
                                        <Text style={styles.primaryButtonText}>Se connecter</Text>
                                        <MaterialIcons name="arrow-forward" size={18} color={COLORS.onPrimary} />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Séparateur */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OU CONTINUER AVEC</Text>
                            </View>

                            {/* Bouton Microsoft */}
                            <TouchableOpacity
                                style={styles.microsoftButton}
                                activeOpacity={0.8}
                                onPress={() => Alert.alert('Microsoft OAuth', 'Redirection vers la connexion Microsoft EMSI...')}
                            >
                                <View style={styles.msLogoGrid}>
                                    <View style={[styles.msTile, { backgroundColor: '#f25022' }]} />
                                    <View style={[styles.msTile, { backgroundColor: '#7fba00' }]} />
                                    <View style={[styles.msTile, { backgroundColor: '#00a4ef' }]} />
                                    <View style={[styles.msTile, { backgroundColor: '#ffb900' }]} />
                                </View>
                                <Text style={styles.microsoftButtonText}>Se connecter avec Microsoft</Text>
                            </TouchableOpacity>

                        </View>

                        {/* Carte Activation / Première Connexion */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Signup')}
                            style={styles.activationCard}
                            activeOpacity={0.8}
                        >
                            <View style={styles.activationLeft}>
                                <View style={styles.activationIconBox}>
                                    <MaterialIcons name="verified-user" size={20} color={COLORS.onSecondaryContainer} />
                                </View>
                                <View style={styles.activationTextCol}>
                                    <Text style={styles.activationTitle}>Première connexion ?</Text>
                                    <Text style={styles.activationSubtitle}>Activer mon compte étudiant</Text>
                                </View>
                            </View>
                            <MaterialIcons name="arrow-forward" size={18} color={COLORS.outline} />
                        </TouchableOpacity>

                        {/* Footer Sécurité */}
                        <View style={styles.footerContainer}>
                            <MaterialIcons name="verified" size={16} color={COLORS.outline} />
                            <Text style={styles.footerText}>
                                Accès sécurisé réservé aux étudiants & lauréats EMSI
                            </Text>
                        </View>

                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },

    /* Header */
    headerContainer: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    editionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceContainerLowest,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.tertiary,
        marginRight: 8,
    },
    editionBadgeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        color: COLORS.onSurfaceVariant,
        letterSpacing: 1,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    logoBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    logoTextCol: {
        justifyContent: 'center',
    },
    logoTitle: {
        fontFamily: 'Syne-ExtraBold',
        fontSize: 26,
        color: COLORS.primary,
        lineHeight: 28,
        letterSpacing: -0.5,
    },
    logoSubtitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        color: COLORS.onSurfaceVariant,
        letterSpacing: 1.5,
    },
    mainTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 26,
        color: COLORS.onSurface,
        marginTop: 4,
        letterSpacing: -0.5,
    },
    mainSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: COLORS.onSurfaceVariant,
        textAlign: 'center',
        marginTop: 4,
        maxWidth: 280,
    },

    /* Form Card */
    card: {
        backgroundColor: COLORS.surfaceContainerLowest,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        gap: 16,
    },
    inputGroup: {
        gap: 6,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: COLORS.onSurface,
        letterSpacing: 0.5,
    },
    badgeConnect: {
        backgroundColor: COLORS.surfaceContainer,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeConnectText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 10,
        color: COLORS.primary,
    },
    forgotPasswordText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 10,
        color: COLORS.primary,
    },
    inputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    inputIconLeft: {
        position: 'absolute',
        left: 14,
        zIndex: 1,
    },
    inputIconRight: {
        position: 'absolute',
        right: 14,
        zIndex: 1,
    },
    input: {
        fontFamily: 'Inter-Regular',
        height: 48,
        backgroundColor: COLORS.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: COLORS.surfaceContainerHighest,
        borderRadius: 12,
        paddingLeft: 44,
        paddingRight: 16,
        fontSize: 14,
        color: COLORS.onSurface,
    },
    inputWithRightIcon: {
        paddingRight: 44,
    },

    /* Primary Button */
    primaryButton: {
        height: 48,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.onPrimary,
        fontSize: 14,
    },

    /* Divider */
    dividerContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    dividerLine: {
        width: '100%',
        height: 1,
        backgroundColor: COLORS.surfaceContainerHighest,
    },
    dividerText: {
        fontFamily: 'Inter-Bold',
        position: 'absolute',
        backgroundColor: COLORS.surfaceContainerLowest,
        paddingHorizontal: 12,
        fontSize: 10,
        color: COLORS.outline,
        letterSpacing: 0.5,
    },

    /* Bouton Microsoft */
    microsoftButton: {
        height: 48,
        backgroundColor: COLORS.surfaceContainerHigh,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    msLogoGrid: {
        width: 18,
        height: 18,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
    },
    msTile: {
        width: 8,
        height: 8,
    },
    microsoftButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.onSurface,
        fontSize: 14,
    },

    /* Activation Card */
    activationCard: {
        backgroundColor: COLORS.surfaceContainerLowest,
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
},
activationLeft: {
    flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
},
activationIconBox: {
    width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.secondaryContainer,
        justifyContent: 'center',
        alignItems: 'center',
},
activationTextCol: {
    justifyContent: 'center',
},
activationTitle: {
    fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
        color: COLORS.onSurface,
},
activationSubtitle: {
    fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: COLORS.primary,
},

/* Footer */
footerContainer: {
    flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 24,
},
footerText: {
    fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: COLORS.onSurfaceVariant,
},
});