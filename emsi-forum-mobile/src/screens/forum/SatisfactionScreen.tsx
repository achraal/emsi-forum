import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import api from '../../services/api';
import { useAppTheme } from '../../context/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<
    RootStackParamList,
    'Satisfaction'
>;

interface SurveyData {
    id: number;
    rating: number;
    feedback: string | null;
}

export default function SatisfactionScreen({ navigation }: Props) {
    const { colors, isDark } = useAppTheme();

    const [rating, setRating] = useState<number>(3);
    const [feedback, setFeedback] = useState<string>('');
    const [fetching, setFetching] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

    const ratingLabels: { [key: number]: string } = {
        1: 'Médiocre 😞',
        2: 'Passable 😐',
        3: 'Moyen 🙂',
        4: 'Très bien 😊',
        5: 'Excellent ! 🤩',
    };

    useEffect(() => {
        fetchSurvey();
    }, []);

    const fetchSurvey = async () => {
        try {
            const response = await api.get<SurveyData | null>('/api/survey/');
            if (response.data) {
                setRating(response.data.rating);
                setFeedback(response.data.feedback || '');
                setHasSubmitted(true);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération de l'avis :", error);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.post('/api/survey/', { rating, feedback });
            setHasSubmitted(true);
            Alert.alert("Merci !", "Votre avis a été enregistré avec succès.");
            Keyboard.dismiss();
        } catch (error) {
            console.error("Erreur d'envoi du sondage :", error);
            Alert.alert("Erreur", "Impossible d'envoyer l'avis.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
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
                        Avis & Feedback
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        style={[styles.container, { backgroundColor: colors.surface }]}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={[styles.mainTitle, { color: colors.onSurface }]}>
                            Évaluez le Forum EMSI
                        </Text>

                        {hasSubmitted && (
                            <View style={[styles.submittedBanner, { backgroundColor: colors.secondaryContainer }]}>
                                <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                                <Text style={[styles.submittedText, { color: colors.onSecondaryContainer }]}>
                                    Vous avez déjà envoyé un avis. Vous pouvez le modifier ci-dessous.
                                </Text>
                            </View>
                        )}

                        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}>
                            <Text style={[styles.subtitle, { color: colors.onSurface }]}>
                                Comment s'est passée votre expérience ?
                            </Text>

                            {/* Système d'étoiles sur mesure */}
                            <View style={styles.starsContainer}>
                                {[1, 2, 3, 4, 5].map((starValue) => (
                                    <TouchableOpacity
                                        key={starValue}
                                        onPress={() => setRating(starValue)}
                                        activeOpacity={0.7}
                                        style={styles.starButton}
                                    >
                                        <MaterialIcons
                                            name={starValue <= rating ? "star" : "star-outline"}
                                            size={38}
                                            color={starValue <= rating ? colors.starActive : colors.starInactive}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Label contextuel sous les étoiles */}
                            <Text style={[styles.ratingLabelText, { color: colors.primary }]}>
                                {ratingLabels[rating] || ''}
                            </Text>

                            <Text style={[styles.subtitle, { color: colors.onSurface }]}>
                                Un commentaire ou une suggestion ? (Optionnel)
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        borderColor: colors.surfaceContainerHighest,
                                        backgroundColor: colors.surfaceContainerLow,
                                        color: colors.onSurface
                                    }
                                ]}
                                multiline
                                numberOfLines={4}
                                placeholder="Dites-nous tout..."
                                placeholderTextColor={colors.outline}
                                value={feedback}
                                onChangeText={setFeedback}
                            />

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    { backgroundColor: colors.primary, shadowColor: colors.primary },
                                    loading && styles.buttonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color={colors.onPrimary} />
                                ) : (
                                    <>
                                        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                                            {hasSubmitted ? "Mettre à jour mon avis" : "Envoyer mon avis"}
                                        </Text>
                                        <MaterialIcons name="send" size={18} color={colors.onPrimary} />
                                    </>
                                )}
                            </TouchableOpacity>
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
    },
    keyboardContainer: {
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

    /* Main Content */
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
        gap: 16,
    },
    mainTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 22,
        textAlign: 'center',
        marginTop: 8,
    },
    submittedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        padding: 12,
    },
    submittedText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        flex: 1,
    },

    /* Form Card */
    card: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    subtitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        marginTop: 12,
    },

    /* Étoiles personnalisées */
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginVertical: 16,
    },
    starButton: {
        padding: 4,
    },
    ratingLabelText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },

    input: {
        fontFamily: 'Inter-Regular',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 14,
    },
    button: {
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },
});