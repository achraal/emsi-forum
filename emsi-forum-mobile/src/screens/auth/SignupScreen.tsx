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
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

import api from '../../services/api';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';

WebBrowser.maybeCompleteAuthSession();

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

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
    const { setToken } = useAuthStore();
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [microsoftLoading, setMicrosoftLoading] = useState<boolean>(false);

    // Configuration OAuth Microsoft (Azure AD / Entra ID)
    // Remplacez 'YOUR_MICROSOFT_CLIENT_ID' par votre ID d'application Azure AD
    const TENANT_ID = 'common'; // ou votre ID de tenant EMSI si spécifique
    const CLIENT_ID = 'YOUR_MICROSOFT_CLIENT_ID';

    const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'emsiforum', // Doit correspondre au schéma dans votre app.json
    });

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: CLIENT_ID,
            scopes: ['openid', 'profile', 'email', 'User.Read'],
            redirectUri,
        },
        { authorizationEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize` }
    );

    // Gérer la réponse de Microsoft OAuth
    React.useEffect(() => {
        if (response?.type === 'success') {
            const { code } = response.params;
            handleMicrosoftBackendAuth(code);
        }
    }, [response]);

    const handleMicrosoftBackendAuth = async (authCode: string) => {
        setMicrosoftLoading(true);
        try {
            // Envoyer le code d'autorisation à votre backend FastAPI pour valider et créer/connecter l'utilisateur
            const backendRes = await api.post('/api/auth/microsoft', { code: authCode, redirect_uri: redirectUri });

            if (backendRes.data && backendRes.data.access_token) {
                await setToken(backendRes.data.access_token, backendRes.data.user);
                Alert.alert('Succès', 'Connexion Microsoft réussie !');
                // La navigation vers l'accueil se fera automatiquement selon votre logique de store/stack
            }
        } catch (error: any) {
            console.error("Erreur authentification Microsoft :", error);
            Alert.alert('Erreur Microsoft', error.response?.data?.detail || 'Impossible de se connecter avec Microsoft.');
        } finally {
            setMicrosoftLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!firstName || !lastName || !email || !password) {
            Alert.alert('Champs requis', 'Veuillez remplir tous les champs du formulaire.');
            return;
        }

        if (!email.trim().toLowerCase().endsWith('@emsi-edu.ma')) {
            Alert.alert(
                'Email institutionnel requis',
                'Vous devez utiliser votre adresse email étudiant (@emsi-edu.ma) pour vous inscrire.'
            );
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/auth/signup', {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim().toLowerCase(),
                password: password
            });

            Alert.alert(
                'Compte créé !',
                'Votre inscription a été effectuée avec succès. Vous pouvez maintenant vous connecter.',
                [{ text: 'Se connecter', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            console.error("Erreur d'inscription :", error);
            const errorMessage = error.response?.data?.detail || 'Une erreur est survenue lors de l\'inscription.';
            Alert.alert('Échec de l\'inscription', errorMessage);
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
                            <View style={styles.editionBadge}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.editionBadgeText}>COMPTE ÉTUDIANT EMSI</Text>
                            </View>

                            <View style={styles.logoRow}>
                                <View style={styles.logoBox}>
                                    <MaterialIcons name="school" size={24} color={COLORS.onPrimary} />
                                </View>
                                <View style={styles.logoTextCol}>
                                    <Text style={styles.logoTitle}>EMSI</Text>
                                    <Text style={styles.logoSubtitle}>ÉCOLE D'INGÉNIERIE</Text>
                                </View>
                            </View>

                            <Text style={styles.mainTitle}>Créer un compte</Text>
                            <Text style={styles.mainSubtitle}>
                                Inscrivez-vous pour accéder au Forum Entreprises & déposer votre CV
                            </Text>
                        </View>

                        {/* Carte Formulaire */}
                        <View style={styles.card}>

                            {/* Champ Prénom */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>PRÉNOM</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcons name="person-outline" size={20} color={COLORS.outline} style={styles.inputIconLeft} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ex: Achraf"
                                        placeholderTextColor={COLORS.outline}
                                        autoCapitalize="words"
                                        value={firstName}
                                        onChangeText={setFirstName}
                                    />
                                </View>
                            </View>

                            {/* Champ Nom */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>NOM</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcons name="badge" size={20} color={COLORS.outline} style={styles.inputIconLeft} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ex: Ait Lahcen"
                                        placeholderTextColor={COLORS.outline}
                                        autoCapitalize="words"
                                        value={lastName}
                                        onChangeText={setLastName}
                                    />
                                </View>
                            </View>

                            {/* Champ Email Institutionnel */}
                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>EMAIL INSTITUTIONNEL</Text>
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
                                <Text style={styles.helperText}>Uniquement l'adresse @emsi-edu.ma</Text>
                            </View>

                            {/* Champ Mot de passe */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>MOT DE PASSE</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcons name="lock-outline" size={20} color={COLORS.outline} style={styles.inputIconLeft} />
                                    <TextInput
                                        style={[styles.input, styles.inputWithRightIcon]}
                                        placeholder="Saisissez votre mot de passe"
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

                            {/* Bouton d'Inscription */}
                            <TouchableOpacity
                                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                                onPress={handleSignup}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.onPrimary} />
                                ) : (
                                    <>
                                        <Text style={styles.primaryButtonText}>S'inscrire</Text>
                                        <MaterialIcons name="arrow-forward" size={18} color={COLORS.onPrimary} />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Séparateur */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OU CONTINUER AVEC</Text>
                            </View>

                            {/* Bouton Microsoft Réel */}
                            <TouchableOpacity
                                style={[styles.microsoftButton, microsoftLoading && styles.buttonDisabled]}
                                activeOpacity={0.8}
                                disabled={!request || microsoftLoading}
                                onPress={() => promptAsync()}
                            >
                                {microsoftLoading ? (
                                    <ActivityIndicator color={COLORS.onSurface} size="small" />
                                ) : (
                                    <>
                                        <View style={styles.msLogoGrid}>
                                            <View style={[styles.msTile, { backgroundColor: '#f25022' }]} />
                                            <View style={[styles.msTile, { backgroundColor: '#7fba00' }]} />
                                            <View style={[styles.msTile, { backgroundColor: '#00a4ef' }]} />
                                            <View style={[styles.msTile, { backgroundColor: '#ffb900' }]} />
                                        </View>
                                        <Text style={styles.microsoftButtonText}>S'inscrire avec Microsoft</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                        </View>

                        {/* Lien vers Connexion */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            style={styles.linkContainer}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.linkText}>
                                Vous avez déjà un compte ? <Text style={styles.linkBold}>Se connecter</Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Footer Sécurité */}
                        <View style={styles.footerContainer}>
                            <MaterialIcons name="verified" size={16} color={COLORS.outline} />
                            <Text style={styles.footerText}>
                                Inscription réservée aux étudiants EMSI
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
        marginBottom: 20,
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
        maxWidth: 290,
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
        gap: 14,
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
    helperText: {
        fontFamily: 'Inter-Regular',
        fontSize: 10,
        color: COLORS.outline,
        marginTop: 2,
        fontStyle: 'italic',
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
        marginTop: 6,
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
        marginVertical: 2,
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

    /* Microsoft Button */
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

    /* Navigation Link */
    linkContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        fontFamily: 'Inter-Regular',
        color: COLORS.onSurfaceVariant,
        fontSize: 14,
    },
    linkBold: {
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.primary,
    },

    /* Footer */
    footerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 20,
    },
    footerText: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: COLORS.onSurfaceVariant,
    },
});