import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    Modal,
    SafeAreaView,
    StatusBar
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons } from '@expo/vector-icons';

import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../context/ThemeContext';
import { MainTabScreenProps } from '../../navigation/types';

export interface UserProfile {
    id: number | string;
    email: string;
    first_name: string;
    last_name: string;
    filiere?: string | null;
    promo?: string | null;
    site?: string | null;
    classe?: string | null;
    cv_url?: string | null;
    github_url?: string | null;
    skills?: string | null;
    role: string;
}

const SUGGESTED_SKILLS = [
    'Next.js',
    'Kubernetes',
    'Flutter',
    'Spring Boot',
    'GraphQL',
    'FastAPI',
    'Tailwind CSS',
    'React Native',
    'AWS'
];

export default function ProfileScreen({ navigation }: MainTabScreenProps<'Profil'>) {
    const { colors, isDark } = useAppTheme();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [uploading, setUploading] = useState<boolean>(false);
    const [qrModalVisible, setQrModalVisible] = useState<boolean>(false);

    // Form states
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [filiere, setFiliere] = useState<string>('');
    const [promo, setPromo] = useState<string>('');
    const [site, setSite] = useState<string>('');
    const [classe, setClasse] = useState<string>('');
    const [githubUrl, setGithubUrl] = useState<string>('');

    // Skills states & modal
    const [skills, setSkills] = useState<string[]>(['React', 'Python', 'Cloud & DevOps', 'Docker', 'PostgreSQL']);
    const [skillsModalVisible, setSkillsModalVisible] = useState<boolean>(false);
    const [newSkillInput, setNewSkillInput] = useState<string>('');

    const logout = useAuthStore(state => state.logout);
    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get<UserProfile>('/api/profile/');
            const data = response.data;
            setProfile(data);
            setFirstName(data.first_name || '');
            setLastName(data.last_name || '');
            setFiliere(data.filiere || '');
            setGithubUrl(data.github_url || '');
            setPromo(data.promo || '');
            setSite(data.site || '');
            setClasse(data.classe || '');

            if (data.skills) {
                const parsedSkills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
                if (parsedSkills.length > 0) {
                    setSkills(parsedSkills);
                }
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de récupérer le profil.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            const payload: Partial<UserProfile> = {
                first_name: firstName,
                last_name: lastName,
            };

            if (!isAdmin) {
                payload.filiere = filiere;
                payload.promo = promo;
                payload.site = site;
                payload.classe = classe;
                payload.github_url = githubUrl.trim();
            }

            const response = await api.put<UserProfile>('/api/profile/', payload);
            setProfile(response.data);
            setIsEditing(false);
            Alert.alert('Succès', 'Profil mis à jour !');
        } catch (error) {
            Alert.alert('Erreur', 'Mise à jour échouée.');
        }
    };

    const saveSkillsToBackend = async (updatedSkills: string[]) => {
        setSkills(updatedSkills);
        try {
            const skillsString = updatedSkills.join(',');
            const response = await api.put<UserProfile>('/api/profile/', {
                skills: skillsString
            });
            setProfile(response.data);
        } catch (error) {
            console.error("Erreur de sauvegarde des compétences :", error);
            Alert.alert('Erreur', 'Échec de la sauvegarde des compétences.');
        }
    };

    const handleAddSkillManual = () => {
        const trimmed = newSkillInput.trim();
        if (!trimmed) return;

        if (skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
            Alert.alert('Information', 'Cette compétence existe déjà.');
            return;
        }

        const newSkillsList = [...skills, trimmed];
        saveSkillsToBackend(newSkillsList);
        setNewSkillInput('');
    };

    const handleAddSuggestedSkill = (skillName: string) => {
        if (!skills.includes(skillName)) {
            const newSkillsList = [...skills, skillName];
            saveSkillsToBackend(newSkillsList);
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        const newSkillsList = skills.filter(s => s !== skillToRemove);
        saveSkillsToBackend(newSkillsList);
    };

    const handlePickAndUploadCV = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const selectedFile = result.assets[0];
            const isPdf = selectedFile.name.toLowerCase().endsWith('.pdf') || selectedFile.mimeType === 'application/pdf';

            if (!isPdf) {
                Alert.alert('Format non supporté', 'Seuls les fichiers PDF sont acceptés.');
                return;
            }

            setUploading(true);
            const formData = new FormData();
            formData.append('file', {
                uri: selectedFile.uri,
                name: selectedFile.name || 'mon_cv.pdf',
                type: 'application/pdf'
            } as any);

            const response = await api.post<UserProfile>('/api/profile/upload-cv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setProfile(response.data);
            Alert.alert('Succès', 'Votre CV PDF a été téléversé avec succès !');

        } catch (error: any) {
            console.error("Erreur d'upload du CV :", error);
            Alert.alert('Erreur', "Échec de l'importation du CV.");
        } finally {
            setUploading(false);
        }
    };

    const handleInspectCV = async () => {
        if (!profile?.cv_url) {
            Alert.alert("Information", "Aucun CV disponible.");
            return;
        }

        const baseURL = api.defaults.baseURL || '';
        const fullCvUrl = `${baseURL.replace(/\/$/, '')}${profile.cv_url.startsWith('/') ? '' : '/'}${profile.cv_url}`;

        try {
            await WebBrowser.openBrowserAsync(fullCvUrl);
        } catch (error) {
            Alert.alert("Erreur", "Impossible d'afficher le CV.");
        }
    };

    const handleDeleteCV = () => {
        Alert.alert(
            'Confirmation',
            'Voulez-vous vraiment supprimer votre CV ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await api.delete<UserProfile>('/api/profile/delete-cv');
                            setProfile(response.data);
                            Alert.alert('Succès', 'Votre CV a été supprimé.');
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer le CV.');
                        }
                    }
                }
            ]
        );
    };

    const getFormattedCVName = () => {
        if (!profile?.cv_url) return 'Aucun CV synchronisé';
        const parts = profile.cv_url.split('/');
        return parts[parts.length - 1] || 'Mon_CV.pdf';
    };

    const getQRCodeData = () => {
        if (!profile) return '';
        const baseURL = api.defaults.baseURL || '';
        return JSON.stringify({
            id: profile.id,
            nom: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
            github: profile.github_url || 'Non renseigné',
            cv: profile.cv_url ? `${baseURL.replace(/\/$/, '')}${profile.cv_url.startsWith('/') ? '' : '/'}${profile.cv_url}` : 'Pas de CV'
        });
    };

    const getInitials = () => {
        if (!profile?.first_name && !profile?.last_name) return 'EM';
        const f = profile?.first_name?.charAt(0) || '';
        const l = profile?.last_name?.charAt(0) || '';
        return `${f}${l}`.toUpperCase();
    };

    const handleAiAnalysisClick = () => {
        Alert.alert('Fonctionnalité en cours', 'L\'analyse de votre CV par IA sera disponible prochainement !');
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.surface }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={colors.surface}
            />

            {/* Header Fixe */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceContainerHighest }]}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerTitleCol}>
                        <Text style={[styles.headerCategory, { color: colors.secondary }]}>Forum Entreprises EMSI</Text>
                        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                            {isAdmin ? 'Mon Profil Administrateur' : 'Profil & CV'}
                        </Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => (navigation as any).navigate('Settings')}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="settings" size={22} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={[styles.container, { backgroundColor: colors.surface }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Status Bar & QR Fast Access (Réservé aux étudiants) */}
                {!isAdmin && (
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: colors.secondaryContainer }]}>
                            <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.statusBadgeText, { color: colors.onSecondaryContainer }]}>
                                Recherche Stage PFE (Pré-Embauche)
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.qrPassButton, { backgroundColor: colors.surfaceContainerLowest }]}
                            onPress={() => setQrModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="qr-code-2" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Identity Card */}
                <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}>
                    <View style={styles.decorativeCircle} />

                    <View style={styles.identityRow}>
                        {/* Avatar */}
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.avatarInitials, { color: colors.onPrimary }]}>{getInitials()}</Text>
                            </View>
                            <View style={[styles.verifiedBadge, { backgroundColor: colors.surfaceContainerLowest }]}>
                                <MaterialIcons name="verified" size={16} color={colors.primary} />
                            </View>
                        </View>

                        {/* Identity Info */}
                        <View style={styles.identityInfo}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.userName, { color: colors.onSurface }]} numberOfLines={1}>
                                    {profile?.first_name} {profile?.last_name}
                                </Text>
                                {!isAdmin && profile?.promo && (
                                    <View style={[styles.promoTag, { backgroundColor: colors.surfaceContainer }]}>
                                        <Text style={[styles.promoTagText, { color: colors.onSurfaceVariant }]}>
                                            Promo {profile.promo}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <Text style={[styles.userRole, { color: colors.onSurfaceVariant }]}>
                                {isAdmin ? 'Administrateur EMSI' : 'Élève Ingénieur'}
                            </Text>

                            {!isAdmin && (
                                <View style={styles.tagsContainer}>
                                    <View style={[styles.filiereTag, { backgroundColor: colors.surfaceContainerHigh }]}>
                                        <Text style={[styles.filiereTagText, { color: colors.secondary }]} numberOfLines={1}>
                                            {profile?.filiere || '4IIR – Génie Informatique & Réseaux'}
                                        </Text>
                                    </View>
                                    {profile?.classe && (
                                        <View style={[styles.filiereTag, { backgroundColor: colors.surfaceContainerHigh }]}>
                                            <Text style={[styles.filiereTagText, { color: colors.secondary }]}>
                                                Classe: {profile.classe}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            <View style={styles.locationRow}>
                                <MaterialIcons name="location-on" size={15} color={colors.outline} />
                                <Text style={[styles.locationText, { color: colors.onSurfaceVariant }]}>
                                    {profile?.site ? `EMSI ${profile.site}` : 'EMSI Casablanca'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Formulaire de modification rapide des informations personnelles */}
                {isEditing ? (
                    <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Éditer les informations personnelles</Text>

                        <Text style={[styles.label, { color: colors.outline }]}>PRÉNOM</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                            value={firstName}
                            onChangeText={setFirstName}
                        />

                        <Text style={[styles.label, { color: colors.outline }]}>NOM</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                            value={lastName}
                            onChangeText={setLastName}
                        />

                        {!isAdmin && (
                            <>
                                <Text style={[styles.label, { color: colors.outline }]}>FILIÈRE</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                    value={filiere}
                                    onChangeText={setFiliere}
                                    placeholder="Ex: 4IIR"
                                    placeholderTextColor={colors.outline}
                                />

                                <Text style={[styles.label, { color: colors.outline }]}>PROMO</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                    value={promo}
                                    onChangeText={setPromo}
                                    placeholder="Ex: 2025"
                                    placeholderTextColor={colors.outline}
                                />

                                <Text style={[styles.label, { color: colors.outline }]}>SITE / CAMPUS</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                    value={site}
                                    onChangeText={setSite}
                                    placeholder="Ex: Les Orangers, Centre, Roudani..."
                                    placeholderTextColor={colors.outline}
                                />

                                <Text style={[styles.label, { color: colors.outline }]}>CLASSE / GROUPE</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                    value={classe}
                                    onChangeText={setClasse}
                                    placeholder="Ex: Groupe 2"
                                    placeholderTextColor={colors.outline}
                                />

                                <Text style={[styles.label, { color: colors.outline }]}>GITHUB URL</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                    value={githubUrl}
                                    onChangeText={setGithubUrl}
                                    placeholder="https://github.com/..."
                                    placeholderTextColor={colors.outline}
                                    autoCapitalize="none"
                                />
                            </>
                        )}

                        <View style={styles.formActionsRow}>
                            <TouchableOpacity style={[styles.formButton, { backgroundColor: colors.surfaceContainerHigh }]} onPress={() => setIsEditing(false)}>
                                <Text style={[styles.formButtonText, { color: colors.onSurface }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.formButton, { backgroundColor: colors.primary }]} onPress={handleUpdate}>
                                <Text style={[styles.formButtonText, { color: colors.onPrimary }]}>Enregistrer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity style={[styles.editProfileOutlineBtn, { borderColor: colors.primary }]} onPress={() => setIsEditing(true)}>
                        <MaterialIcons name="edit" size={18} color={colors.primary} />
                        <Text style={[styles.editProfileOutlineBtnText, { color: colors.primary }]}>Modifier mes informations</Text>
                    </TouchableOpacity>
                )}

                {/* --- SECTIONS SPÉCIFIQUES ÉTUDIANT (CVS, METRICS, SKILLS, MATCHING) --- */}
                {!isAdmin && (
                    <>
                        {/* Realtime Metrics Grid */}
                        <View style={styles.metricsGrid}>
                            <View style={[styles.metricCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                                <MaterialIcons name="visibility" size={20} color={colors.secondary} />
                                <View style={styles.metricBottom}>
                                    <Text style={[styles.metricValue, { color: colors.onSurface }]}>3</Text>
                                    <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Entreprises consultées</Text>
                                </View>
                            </View>

                            <View style={[styles.metricCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                                <View style={styles.metricTopRow}>
                                    <MaterialIcons name="event" size={20} color={colors.tertiary} />
                                    <View style={[styles.activePingDot, { backgroundColor: colors.tertiary }]} />
                                </View>
                                <View style={styles.metricBottom}>
                                    <Text style={[styles.metricValue, { color: colors.onSurface }]}>1</Text>
                                    <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Entretien prévu</Text>
                                </View>
                            </View>

                            <View style={[styles.metricCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                                <MaterialIcons name="contactless" size={20} color={colors.primary} />
                                <View style={styles.metricBottom}>
                                    <Text style={[styles.metricValue, { color: colors.onSurface }]}>4</Text>
                                    <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Scans recruteur</Text>
                                </View>
                            </View>
                        </View>

                        {/* Primary CTA: Upload CV */}
                        <TouchableOpacity
                            style={[styles.primaryCtaButton, { backgroundColor: colors.primary }]}
                            onPress={handlePickAndUploadCV}
                            disabled={uploading}
                            activeOpacity={0.8}
                        >
                            {uploading ? (
                                <ActivityIndicator color={colors.onPrimary} />
                            ) : (
                                <>
                                    <MaterialIcons name="upload-file" size={20} color={colors.onPrimary} />
                                    <Text style={[styles.primaryCtaText, { color: colors.onPrimary }]}>Importer un nouveau CV (PDF)</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* AI Diagnostic Card */}
                        <TouchableOpacity
                            style={[styles.aiCard, { backgroundColor: colors.surfaceContainerLowest }]}
                            onPress={handleAiAnalysisClick}
                            activeOpacity={0.7}
                        >
                            <View style={styles.aiLeft}>
                                <View style={[styles.aiIconBox, { backgroundColor: colors.surfaceContainer }]}>
                                    <MaterialIcons name="psychology" size={22} color={colors.primary} />
                                </View>
                                <View style={styles.aiTextCol}>
                                    <Text style={[styles.aiTitle, { color: colors.onSurface }]}>Analyse IA de mon CV</Text>
                                    <Text style={[styles.aiSubtitle, { color: colors.onSurfaceVariant }]}>Mots-clés ATS, score lisibilité, impact</Text>
                                </View>
                            </View>
                            <View style={styles.aiRight}>
                                <View style={[styles.aiBadge, { backgroundColor: colors.secondaryContainer }]}>
                                    <Text style={[styles.aiBadgeText, { color: colors.onSecondaryContainer }]}>92/100 Optimisé</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={18} color={colors.outline} />
                            </View>
                        </TouchableOpacity>

                        {/* Active Document Forum */}
                        <View style={styles.sectionBlock}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Document Actif Forum</Text>
                                <View style={styles.syncRow}>
                                    <View style={[styles.syncDot, { backgroundColor: colors.primary }]} />
                                    <Text style={[styles.syncText, { color: colors.primary }]}>Synchronisé Stand</Text>
                                </View>
                            </View>

                            <View style={[styles.docCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                                <View style={styles.docLeft}>
                                    <View style={[styles.pdfIconBox, { backgroundColor: colors.errorContainer }]}>
                                        <MaterialIcons name="picture-as-pdf" size={24} color={colors.error} />
                                    </View>
                                    <View style={styles.docTextCol}>
                                        <Text style={[styles.docName, { color: colors.onSurface }]} numberOfLines={1}>
                                            {getFormattedCVName()}
                                        </Text>
                                        <Text style={[styles.docMeta, { color: colors.onSurfaceVariant }]}>
                                            {profile?.cv_url ? 'CV au format PDF • En ligne' : 'Importez votre CV ci-dessus'}
                                        </Text>
                                    </View>
                                </View>

                                {profile?.cv_url && (
                                    <View style={styles.docActions}>
                                        <TouchableOpacity style={styles.docActionButton} onPress={handleInspectCV}>
                                            <MaterialIcons name="visibility" size={20} color={colors.onSurfaceVariant} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.docActionButton} onPress={handleDeleteCV}>
                                            <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Key Skills & Filières */}
                        <View style={styles.sectionBlock}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Compétences clés & Filières</Text>
                                <TouchableOpacity style={styles.addSkillBtn} onPress={() => setSkillsModalVisible(true)}>
                                    <MaterialIcons name="add" size={16} color={colors.primary} />
                                    <Text style={[styles.addSkillBtnText, { color: colors.primary }]}>Gérer / Ajouter</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.skillsChipFlow}>
                                {skills.map((skill, index) => (
                                    <View key={index} style={[styles.skillChipGreen, { backgroundColor: colors.surfaceContainer }]}>
                                        <Text style={[styles.skillChipGreenText, { color: colors.primary }]}>
                                            {skill}
                                        </Text>
                                        <MaterialIcons name="check-circle" size={14} color={colors.primary} />
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Recruiter Match Card */}
                        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}>
                            <View style={styles.matchHeader}>
                                <View style={styles.matchTitleRow}>
                                    <View style={[styles.tertiaryDot, { backgroundColor: colors.tertiary }]} />
                                    <Text style={[styles.matchCategoryText, { color: colors.tertiary }]}>Top Match Entreprises</Text>
                                </View>
                                <View style={[styles.matchBadge, { backgroundColor: colors.surfaceContainer }]}>
                                    <Text style={[styles.matchBadgeText, { color: colors.onSurfaceVariant }]}>3 offres ciblées</Text>
                                </View>
                            </View>

                            <Text style={[styles.matchTitle, { color: colors.onSurface }]}>Capgemini, Thales & OCP Solutions</Text>
                            <Text style={[styles.matchDescription, { color: colors.onSurfaceVariant }]}>
                                Vos compétences concordent à 94% avec les postes Cloud Engineer & Full Stack ouverts aujourd'hui au Hall A & B.
                            </Text>

                            <View style={styles.matchActionsRow}>
                                <TouchableOpacity
                                    style={[styles.sendDossierBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => Alert.alert('Transmission', 'Dossier transmis aux recruteurs sélectionnés !')}
                                >
                                    <MaterialIcons name="send" size={18} color={colors.onPrimary} />
                                    <Text style={[styles.sendDossierBtnText, { color: colors.onPrimary }]}>Transmettre mon dossier</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.mapIconBtn, { backgroundColor: colors.surfaceContainer }]}
                                    onPress={() => navigation.navigate('Plan' as any)}
                                >
                                    <MaterialIcons name="map" size={20} color={colors.onSurface} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                {/* Déconnexion */}
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <MaterialIcons name="logout" size={18} color={colors.error} />
                    <Text style={[styles.logoutText, { color: colors.error }]}>Se déconnecter</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Modal de Gestion des Compétences */}
            <Modal
                visible={skillsModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setSkillsModalVisible(false)}
            >
                <TouchableOpacity
                    style={[styles.modalOverlay, { backgroundColor: colors.inverseSurface }]}
                    activeOpacity={1}
                    onPress={() => setSkillsModalVisible(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Gérer mes Compétences</Text>
                            <TouchableOpacity onPress={() => setSkillsModalVisible(false)}>
                                <MaterialIcons name="close" size={20} color={colors.onSurface} />
                            </TouchableOpacity>
                        </View>

                        {/* Saisie Manuelle */}
                        <Text style={[styles.label, { color: colors.outline }]}>AJOUTER UNE COMPÉTENCE</Text>
                        <View style={styles.addSkillInputRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                placeholder="ex: Docker, Spring Boot..."
                                placeholderTextColor={colors.outline}
                                value={newSkillInput}
                                onChangeText={setNewSkillInput}
                            />
                            <TouchableOpacity style={[styles.addInputBtn, { backgroundColor: colors.primary }]} onPress={handleAddSkillManual}>
                                <MaterialIcons name="add" size={20} color={colors.onPrimary} />
                            </TouchableOpacity>
                        </View>

                        {/* Suggestions */}
                        <Text style={[styles.label, { color: colors.outline, marginTop: 16 }]}>SUGGESTIONS POPULAIRES</Text>
                        <View style={styles.skillsChipFlow}>
                            {SUGGESTED_SKILLS.map((sug, idx) => {
                                const isAdded = skills.includes(sug);
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[
                                            styles.suggestedChip,
                                            { backgroundColor: isAdded ? colors.surfaceContainerHigh : colors.surfaceContainerLow }
                                        ]}
                                        onPress={() => handleAddSuggestedSkill(sug)}
                                        disabled={isAdded}
                                    >
                                        <Text style={[styles.suggestedChipText, { color: isAdded ? colors.outline : colors.primary }]}>
                                            {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Liste Actuelle avec suppression */}
                        <Text style={[styles.label, { color: colors.outline, marginTop: 16 }]}>MES COMPÉTENCES ({skills.length})</Text>
                        <ScrollView style={styles.skillsListScroll} showsVerticalScrollIndicator={false}>
                            <View style={styles.skillsChipFlow}>
                                {skills.map((skill, index) => (
                                    <View key={index} style={[styles.skillRemovableChip, { backgroundColor: colors.primaryContainer || '#e8f5e9' }]}>
                                        <Text style={[styles.skillChipGreenText, { color: colors.primary }]}>{skill}</Text>
                                        <TouchableOpacity onPress={() => handleRemoveSkill(skill)}>
                                            <MaterialIcons name="cancel" size={16} color={colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity style={[styles.primaryCtaButton, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={() => setSkillsModalVisible(false)}>
                            <Text style={[styles.primaryCtaText, { color: colors.onPrimary }]}>Valider</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Modal Student Pass / QR Code */}
            {!isAdmin && (
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
                            {/* Header Vert Pass */}
                            <View style={[styles.modalHeaderBox, { backgroundColor: colors.primary }]}>
                                <TouchableOpacity
                                    style={styles.modalCloseIconBtn}
                                    onPress={() => setQrModalVisible(false)}
                                >
                                    <MaterialIcons name="close" size={18} color={colors.onPrimary} />
                                </TouchableOpacity>
                                <Text style={styles.modalPassTag}>PASS ÉTUDIANT INSTANTANÉ</Text>
                                <Text style={[styles.modalOwnerName, { color: colors.onPrimary }]}>
                                    {profile?.first_name} {profile?.last_name}
                                </Text>
                                <Text style={[styles.modalOwnerSubtitle, { color: colors.onPrimary }]}>
                                    EMSI {profile?.site || 'Casablanca'} • {profile?.filiere || 'Ingénierie'}
                                </Text>
                            </View>

                            {/* QR Container */}
                            <View style={styles.modalBody}>
                                <View style={[styles.qrCodeWrapper, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.surfaceContainer }]}>
                                    <QRCode
                                        value={getQRCodeData()}
                                        size={180}
                                        color={colors.onSurface}
                                        backgroundColor={colors.surfaceContainerLowest}
                                    />
                                </View>
                                <Text style={[styles.qrScanInstructions, { color: colors.onSurfaceVariant }]}>
                                    Faites scanner ce code au stand pour transmettre votre CV officiel.
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 16,
    },

    /* Header Fixe */
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
        gap: 8,
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
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Status Bar & Fast QR */
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        gap: 6,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    qrPassButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },

    /* Card Identity */
    card: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeCircle: {
        position: 'absolute',
        right: -40,
        bottom: -40,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: 'rgba(0, 107, 49, 0.05)',
    },
    identityRow: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'flex-start',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        fontFamily: 'Syne-Bold',
        fontSize: 20,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    identityInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    userName: {
        fontFamily: 'Syne-Bold',
        fontSize: 20,
    },
    promoTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 9999,
    },
    promoTagText: {
        fontFamily: 'Inter-Regular',
        fontSize: 10,
    },
    userRole: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        marginTop: 2,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    filiereTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    filiereTagText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    locationText: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
    },

    /* Metrics Grid */
    metricsGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    metricCard: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        justifyContent: 'space-between',
        minHeight: 88,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    metricTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activePingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    metricBottom: {
        marginTop: 8,
    },
    metricValue: {
        fontFamily: 'Syne-Bold',
        fontSize: 17,
    },
    metricLabel: {
        fontFamily: 'Inter-Regular',
        fontSize: 10,
        marginTop: 2,
    },

    /* Primary CTA */
    primaryCtaButton: {
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 2,
    },
    primaryCtaText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },

    /* AI Card */
    aiCard: {
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 1,
    },
    aiLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    aiIconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiTextCol: {
        flex: 1,
    },
    aiTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },
    aiSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
    },
    aiRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    aiBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 9999,
    },
    aiBadgeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
    },

    /* Sections */
    sectionBlock: {
        gap: 8,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 17,
    },
    syncRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    syncDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    syncText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 10,
    },

    /* Document Actif Card */
    docCard: {
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 1,
    },
    docLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    pdfIconBox: {
        width: 44,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    docTextCol: {
        flex: 1,
    },
    docName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
    },
    docMeta: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
    },
    docActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    docActionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Skills */
    addSkillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    addSkillBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
    },
    skillsChipFlow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChipGreen: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        gap: 6,
        backgroundColor: 'rgba(0, 107, 49, 0.08)', // Fond vert très léger/subtil
    },
    skillChipGreenText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
    },
    skillRemovableChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        gap: 6,
    },
    suggestedChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    suggestedChipText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
    },

    /* Recruiter Match */
    matchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    matchTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tertiaryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    matchCategoryText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    matchBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 9999,
    },
    matchBadgeText: {
        fontFamily: 'Inter-Regular',
        fontSize: 10,
    },
    matchTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 17,
    },
    matchDescription: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        marginTop: 6,
        lineHeight: 18,
    },
    matchActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    sendDossierBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    sendDossierBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
    },
    mapIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Edit Profile Form */
    label: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        marginTop: 10,
        marginBottom: 4,
    },
    input: {
        fontFamily: 'Inter-Regular',
        height: 44,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
    },
    editProfileOutlineBtn: {
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    editProfileOutlineBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },
    formActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    formButton: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },

    /* Logout */
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        marginTop: 8,
    },
    logoutText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },

    /* Modal Skills & Pass */
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalCard: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 20,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 18,
    },
    addSkillInputRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    addInputBtn: {
        width: 44,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skillsListScroll: {
        maxHeight: 120,
        marginTop: 8,
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