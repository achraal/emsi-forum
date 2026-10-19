import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Linking,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

interface ForgotPasswordModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
    const { colors, isDark } = useAppTheme();

    const handleSendEmail = async () => {
        const adminEmail = 'admin@emsi.ma';
        const subject = encodeURIComponent('Demande de réinitialisation de mot de passe - Forum EMSI');
        const body = encodeURIComponent(
            `Bonjour M. l'Administrateur,\n\nJe souhaite réinitialiser le mot de passe de mon compte sur l'application Forum Entreprises EMSI.\n\nNom & Prénom : \nCINE / Matricule : \nAdresse e-mail du compte : \n\nMerci pour votre assistance.`
        );

        const mailtoUrl = `mailto:${adminEmail}?subject=${subject}&body=${body}`;

        try {
            const canOpen = await Linking.canOpenURL(mailtoUrl);
            if (canOpen) {
                await Linking.openURL(mailtoUrl);
                onClose();
            } else {
                Alert.alert(
                    "Impossible d'ouvrir l'application e-mail",
                    "Veuillez envoyer un e-mail directement à : admin@emsi.ma",
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error("Erreur lors de l'ouverture du lien mail :", error);
            Alert.alert("Erreur", "Impossible de lancer votre application de messagerie.");
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { backgroundColor: colors.inverseSurface }]}>
                <View style={[styles.modalCard, { backgroundColor: colors.surfaceContainerLowest }]}>

                    {/* Icone d'en-tête */}
                    <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainer }]}>
                        <MaterialIcons name="mark-email-read" size={28} color={colors.primary} />
                    </View>

                    {/* Titre & Description */}
                    <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                        Mot de passe oublié ?
                    </Text>
                    <Text style={[styles.modalDescription, { color: colors.onSurfaceVariant }]}>
                        Pour des raisons de sécurité, la réinitialisation de compte est gérée directement par le service informatique de l'EMSI.
                    </Text>

                    {/* Encadré d'adresse admin */}
                    <View style={[styles.emailBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest }]}>
                        <MaterialIcons name="email" size={18} color={colors.primary} />
                        <Text style={[styles.emailText, { color: colors.onSurface }]}>admin@emsi.ma</Text>
                    </View>

                    {/* Boutons d'action */}
                    <View style={styles.modalButtonsRow}>
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.cancelModalText, { color: colors.onSurface }]}>
                                Annuler
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                            onPress={handleSendEmail}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="send" size={16} color={colors.onPrimary} />
                            <Text style={[styles.saveModalText, { color: colors.onPrimary }]}>
                                Envoyer e-mail
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 8,
    },
    modalDescription: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
    },
    emailBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        width: '100%',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emailText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },
    modalButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    cancelModalText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
    saveModalText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
});