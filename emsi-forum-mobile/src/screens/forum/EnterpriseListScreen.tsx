import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    ScrollView,
    SafeAreaView,
    StatusBar,
    LayoutAnimation,
    Platform,
    UIManager
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../context/ThemeContext';
import { Enterprise, RootStackParamList } from '../../navigation/types';

// Activation de LayoutAnimation sur Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface EnterpriseGroup {
    categoryName: string;
    data: Enterprise[];
}

export default function EnterpriseListScreen() {
    const { colors, isDark } = useAppTheme();
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';

    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // État pour gérer les catégories déroulées/enroulées
    const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});

    // États Modal Admin
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    // Champs du formulaire
    const [name, setName] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [targetProfiles, setTargetProfiles] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);

    useEffect(() => {
        fetchEnterprises();
    }, []);

    const fetchEnterprises = async () => {
        try {
            const response = await api.get<Enterprise[]>('/api/enterprises/');
            setEnterprises(response.data);
        } catch (error) {
            console.error("Erreur chargement entreprises:", error);
            Alert.alert("Erreur", "Impossible de charger la liste des entreprises.");
        } finally {
            setLoading(false);
        }
    };

    // Regroupement dynamique par catégorie
    const groupedEnterprises = React.useMemo(() => {
        const groupsMap: { [key: string]: Enterprise[] } = {};

        enterprises.forEach((emp) => {
            const catKey = emp.category && emp.category.trim() !== ''
                ? `${emp.category.trim()} Sponsor`
                : 'Partenaire Officiel';

            if (!groupsMap[catKey]) {
                groupsMap[catKey] = [];
            }
            groupsMap[catKey].push(emp);
        });

        const priorityOrder = ['Diamond Sponsor', 'Gold Sponsor', 'Silver Sponsor', 'Bronze Sponsor', 'Partenaire Officiel'];

        const sortedGroups = Object.keys(groupsMap)
            .sort((a, b) => {
                const indexA = priorityOrder.indexOf(a);
                const indexB = priorityOrder.indexOf(b);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.localeCompare(b);
            })
            .map((catName) => ({
                categoryName: catName,
                data: groupsMap[catName],
            }));

        // Initialise toutes les catégories comme déroulées par défaut au premier chargement
        setExpandedCategories((prev) => {
            const initialExpanded: { [key: string]: boolean } = { ...prev };
            sortedGroups.forEach((group) => {
                if (initialExpanded[group.categoryName] === undefined) {
                    initialExpanded[group.categoryName] = true;
                }
            });
            return initialExpanded;
        });

        return sortedGroups;
    }, [enterprises]);

    // Basculer l'état déroulé / enroulé d'une section
    const toggleCategoryExpand = (categoryName: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedCategories((prev) => ({
            ...prev,
            [categoryName]: !prev[categoryName],
        }));
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setCurrentId(null);
        setName('');
        setCategory('');
        setLogoUrl('');
        setDescription('');
        setTargetProfiles('');
        setModalVisible(true);
    };

    const handleOpenEditModal = (item: Enterprise) => {
        setIsEditing(true);
        setCurrentId(Number(item.id));
        setName(item.name);
        setCategory(item.category || '');
        setLogoUrl(item.logo_url || '');
        setDescription(item.description || '');
        setTargetProfiles(item.target_profiles || '');
        setModalVisible(true);
    };

    const handlePickAndUploadLogo = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const selectedImage = result.assets[0];
            setUploadingLogo(true);

            const formData = new FormData();
            formData.append('file', {
                uri: selectedImage.uri,
                name: selectedImage.fileName || 'logo.jpg',
                type: 'image/jpeg',
            } as any);

            const response = await api.post<{ logo_url: string }>('/api/enterprises/upload-logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setLogoUrl(response.data.logo_url);
            Alert.alert('Succès', 'Logo importé avec succès !');
        } catch (error) {
            console.error("Erreur upload logo :", error);
            Alert.alert('Erreur', "Échec de l'importation du logo.");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSubmitEnterprise = async () => {
        if (!name.trim()) {
            Alert.alert("Champ requis", "Le nom de l'entreprise est obligatoire.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: name.trim(),
                category: category.trim() || null,
                logo_url: logoUrl.trim() || null,
                description: description.trim() || null,
                target_profiles: targetProfiles.trim() || null,
            };

            if (isEditing && currentId) {
                const response = await api.put<Enterprise>(`/api/enterprises/${currentId}`, payload);
                setEnterprises(enterprises.map(e => e.id === currentId ? response.data : e));
                Alert.alert("Succès", "Entreprise modifiée !");
            } else {
                const response = await api.post<Enterprise>('/api/enterprises/', payload);
                setEnterprises([...enterprises, response.data]);
                Alert.alert("Succès", "Entreprise ajoutée !");
            }

            setModalVisible(false);
        } catch (error) {
            console.error("Erreur enregistrement :", error);
            Alert.alert("Erreur", "Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteEnterprise = (id: number | string, enterpriseName: string) => {
        Alert.alert(
            "Confirmation",
            `Voulez-vous supprimer l'entreprise "${enterpriseName}" ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/api/enterprises/${id}`);
                            setEnterprises(enterprises.filter(e => e.id !== id));
                            Alert.alert("Succès", "Entreprise supprimée.");
                        } catch (error) {
                            Alert.alert("Erreur", "Suppression impossible.");
                        }
                    }
                }
            ]
        );
    };

    const renderEnterpriseCard = (item: Enterprise) => {
        const baseURL = api.defaults.baseURL || '';
        const resolvedLogoUrl = item.logo_url
            ? (item.logo_url.startsWith('http')
                ? item.logo_url
                : `${baseURL.replace(/\/$/, '')}${item.logo_url.startsWith('/') ? '' : '/'}${item.logo_url}`)
            : null;

        return (
            <View
                key={String(item.id)}
                style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.surfaceContainerHighest }]}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest }]}>
                        {resolvedLogoUrl ? (
                            <Image source={{ uri: resolvedLogoUrl }} style={styles.logo} />
                        ) : (
                            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.placeholderText, { color: colors.onPrimary }]}>
                                    {item.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.cardTitleContainer}>
                        <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>{item.name}</Text>
                        {item.category ? (
                            <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceContainer }]}>
                                <Text style={[styles.categoryText, { color: colors.secondary }]}>{item.category} Sponsor</Text>
                            </View>
                        ) : (
                            <Text style={[styles.noCategoryText, { color: colors.outline }]}>Partenaire Officiel</Text>
                        )}
                    </View>
                </View>

                {item.target_profiles ? (
                    <Text style={[styles.targetProfilesSummary, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                        🎯 {item.target_profiles}
                    </Text>
                ) : null}

                <View style={[styles.divider, { backgroundColor: colors.surfaceContainerLow }]} />

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('EnterpriseDetail', { enterprise: item })}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Voir la fiche</Text>
                        <MaterialIcons name="arrow-forward" size={16} color={colors.onPrimary} />
                    </TouchableOpacity>

                    {isAdmin && (
                        <View style={styles.adminButtonsRow}>
                            <TouchableOpacity
                                style={[styles.editIconButton, { backgroundColor: colors.surfaceContainer }]}
                                onPress={() => handleOpenEditModal(item)}
                            >
                                <MaterialIcons name="edit" size={18} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.deleteIconButton, { backgroundColor: colors.errorContainer }]}
                                onPress={() => handleDeleteEnterprise(item.id, item.name)}
                            >
                                <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const baseURL = api.defaults.baseURL || '';
    const modalLogoPreview = logoUrl
        ? (logoUrl.startsWith('http')
            ? logoUrl
            : `${baseURL.replace(/\/$/, '')}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`)
        : null;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.surface}
            />

            {/* Header Fixe */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceContainerHighest }]}>
                <View style={styles.headerTitleCol}>
                    <Text style={[styles.headerCategory, { color: colors.secondary }]}>Forum Entreprises EMSI</Text>
                    <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Entreprises Partenaires</Text>
                </View>
            </View>

            <View style={styles.container}>
                {isAdmin && (
                    <View style={styles.adminHeader}>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={handleOpenAddModal}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="add" size={20} color={colors.onPrimary} />
                            <Text style={[styles.addButtonText, { color: colors.onPrimary }]}>Ajouter une entreprise</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {groupedEnterprises.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="business" size={48} color={colors.outline} />
                        <Text style={[styles.emptyText, { color: colors.outline }]}>Aucune entreprise enregistrée.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={groupedEnterprises}
                        keyExtractor={(group) => group.categoryName}
                        renderItem={({ item }) => {
                            const isExpanded = expandedCategories[item.categoryName] ?? true;

                            return (
                                <View style={styles.sectionContainer}>
                                    {/* Header Enroulable/Déroulable */}
                                    <TouchableOpacity
                                        style={[
                                            styles.sectionHeaderRow,
                                            { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest }
                                        ]}
                                        onPress={() => toggleCategoryExpand(item.categoryName)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.sectionHeaderLeft}>
                                            <MaterialIcons name="stars" size={18} color={colors.primary} />
                                            <Text style={[styles.sectionHeaderTitle, { color: colors.primary }]}>
                                                {item.categoryName}
                                            </Text>
                                            <View style={[styles.countBadge, { backgroundColor: colors.surfaceContainerHigh }]}>
                                                <Text style={[styles.countText, { color: colors.onSurfaceVariant }]}>
                                                    {item.data.length}
                                                </Text>
                                            </View>
                                        </View>
                                        <MaterialIcons
                                            name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                                            size={22}
                                            color={colors.outline}
                                        />
                                    </TouchableOpacity>

                                    {/* Contenu Déroulé */}
                                    {isExpanded && (
                                        <View style={styles.cardsGroupContainer}>
                                            {item.data.map((emp) => renderEnterpriseCard(emp))}
                                        </View>
                                    )}
                                </View>
                            );
                        }}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Modal d'Ajout / Modification */}
                <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
                    <View style={[styles.modalOverlay, { backgroundColor: colors.inverseSurface }]}>
                        <View style={[styles.modalCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                                    {isEditing ? "Modifier l'entreprise" : "Nouvelle entreprise"}
                                </Text>

                                <Text style={[styles.label, { color: colors.outline }]}>Nom de l'entreprise *</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                    placeholder="ex: Capgemini"
                                    placeholderTextColor={colors.outline}
                                    value={name}
                                    onChangeText={setName}
                                />

                                <Text style={[styles.label, { color: colors.outline }]}>Catégorie de sponsor</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                    placeholder="ex: Diamond, Gold, Silver"
                                    placeholderTextColor={colors.outline}
                                    value={category}
                                    onChangeText={setCategory}
                                />

                                <Text style={[styles.label, { color: colors.outline }]}>Logo de l'entreprise</Text>
                                <View style={styles.logoInputRow}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                        placeholder="URL du logo ou upload"
                                        placeholderTextColor={colors.outline}
                                        value={logoUrl}
                                        onChangeText={setLogoUrl}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={[styles.uploadLogoBtn, { backgroundColor: colors.secondary }]}
                                        onPress={handlePickAndUploadLogo}
                                        disabled={uploadingLogo}
                                    >
                                        {uploadingLogo ? (
                                            <ActivityIndicator size="small" color={colors.onPrimary} />
                                        ) : (
                                            <>
                                                <MaterialIcons name="photo-library" size={16} color={colors.onPrimary} />
                                                <Text style={[styles.uploadLogoText, { color: colors.onPrimary }]}>Galerie</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {modalLogoPreview && (
                                    <View style={styles.previewContainer}>
                                        <Text style={[styles.previewLabel, { color: colors.outline }]}>Aperçu :</Text>
                                        <View style={[styles.previewImageWrapper, { borderColor: colors.surfaceContainerHighest, backgroundColor: colors.surfaceContainerLow }]}>
                                            <Image source={{ uri: modalLogoPreview }} style={styles.previewImage} />
                                        </View>
                                    </View>
                                )}

                                <Text style={[styles.label, { color: colors.outline, marginTop: 10 }]}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                    placeholder="Description de l'entreprise..."
                                    placeholderTextColor={colors.outline}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                />

                                <Text style={[styles.label, { color: colors.outline }]}>Profils recherchés</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest, color: colors.onSurface }]}
                                    placeholder="ex: Ingénieur logiciel, Cloud & DevOps..."
                                    placeholderTextColor={colors.outline}
                                    value={targetProfiles}
                                    onChangeText={setTargetProfiles}
                                    multiline
                                />

                                <View style={styles.modalButtonsRow}>
                                    <TouchableOpacity
                                        style={[styles.modalBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={[styles.cancelModalText, { color: colors.onSurface }]}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                                        onPress={handleSubmitEnterprise}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <ActivityIndicator color={colors.onPrimary} />
                                        ) : (
                                            <Text style={[styles.saveModalText, { color: colors.onPrimary }]}>Enregistrer</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
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
        justifyContent: 'center',
        borderBottomWidth: 1,
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

    /* Admin Header */
    adminHeader: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    addButton: {
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    addButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },

    /* Structure Regroupée par Section */
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    sectionContainer: {
        marginBottom: 16,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionHeaderTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 15,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    countBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    countText: {
        fontFamily: 'Inter-Bold',
        fontSize: 11,
    },
    cardsGroupContainer: {
        gap: 12,
        paddingTop: 4,
    },

    /* Card Item */
    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        width: 52,
        height: 52,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    placeholderText: {
        fontFamily: 'Syne-Bold',
        fontSize: 20,
    },

    cardTitleContainer: {
        flex: 1,
    },
    name: {
        fontFamily: 'Syne-Bold',
        fontSize: 17,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    categoryText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
    },
    noCategoryText: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
        marginTop: 2,
    },

    targetProfilesSummary: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        marginTop: 10,
        lineHeight: 16,
    },

    divider: {
        height: 1,
        marginVertical: 12,
    },

    /* Actions */
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        height: 40,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    buttonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
    adminButtonsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    editIconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteIconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

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

    /* Modal Form */
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    modalCard: {
        borderRadius: 16,
        maxHeight: '90%',
        padding: 20,
    },
    modalScroll: {
        paddingBottom: 10,
    },
    modalTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 20,
        marginBottom: 16,
        textAlign: 'center',
    },
    label: {
        fontFamily: 'Inter-Bold',
        fontSize: 11,
        marginBottom: 4,
        marginTop: 8,
    },
    input: {
        fontFamily: 'Inter-Regular',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        fontSize: 14,
    },
    logoInputRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    uploadLogoBtn: {
        height: 44,
        paddingHorizontal: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    uploadLogoText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
    },

    /* Modal Preview */
    previewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 10,
    },
    previewLabel: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
    },
    previewImageWrapper: {
        width: 44,
        height: 44,
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },

    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
    },
    modalBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelModalText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },
    saveModalText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },
});