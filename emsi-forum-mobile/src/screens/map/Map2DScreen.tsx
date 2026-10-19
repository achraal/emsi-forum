import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Image,
    TouchableOpacity,
    Text,
    DimensionValue,
    SafeAreaView,
    StatusBar
} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import api from '../../services/api';
import { Enterprise, RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

// Contournement du bug de typage TypeScript de ImageZoom pour React 18+
const ScalableImageZoom = ImageZoom as unknown as React.ComponentType<any>;

export default function Map2DScreen() {
    const [stands, setStands] = useState<Enterprise[]>([]);
    const [zoomContainerHeight, setZoomContainerHeight] = useState<number>(500);
    const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270

    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { colors, isDark } = useAppTheme();

    useEffect(() => {
        api.get<Enterprise[]>('/api/enterprises/')
            .then(response => {
                const mappedStands = response.data.filter((e: Enterprise) => e.map_pos_x && e.map_pos_y);
                setStands(mappedStands);
            })
            .catch(err => console.log("Erreur de chargement des stands :", err));
    }, []);

    const toggleRotation = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    // Calcul des coordonnées transposées en fonction de la rotation
    const getTransformedCoordinates = (x: number, y: number) => {
        switch (rotation) {
            case 90:
                return { left: `${100 - y}%` as DimensionValue, top: `${x}%` as DimensionValue };
            case 180:
                return { left: `${100 - x}%` as DimensionValue, top: `${100 - y}%` as DimensionValue };
            case 270:
                return { left: `${y}%` as DimensionValue, top: `${100 - x}%` as DimensionValue };
            default:
                return { left: `${x}%` as DimensionValue, top: `${y}%` as DimensionValue };
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
                <View style={styles.headerTitleCol}>
                    <Text style={[styles.headerCategory, { color: colors.secondary }]}>
                        Forum Entreprises EMSI
                    </Text>
                    <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                        Plan Interactif 2D
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.rotateButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                    onPress={toggleRotation}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="rotate-right" size={18} color={colors.onPrimary} />
                    <Text style={[styles.rotateButtonText, { color: colors.onPrimary }]}>
                        Pivoter ({rotation}°)
                    </Text>
                </TouchableOpacity>
            </View>

            <View
                style={[styles.container, { backgroundColor: colors.surface }]}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    if (height > 0) {
                        setZoomContainerHeight(height);
                    }
                }}
            >
                <ScalableImageZoom
                    cropWidth={width}
                    cropHeight={zoomContainerHeight}
                    imageWidth={width}
                    imageHeight={width * 1.3}
                    minScale={1}
                    maxScale={4}
                >
                    <View style={[styles.mapContainer, { height: zoomContainerHeight }]}>
                        <Image
                            source={require('../../../assets/map.jpeg')}
                            style={[
                                styles.mapImage,
                                { transform: [{ rotate: `${rotation}deg` }] }
                            ]}
                        />

                        {stands.map((stand) => {
                            const posX = Number(stand.map_pos_x) || 0;
                            const posY = Number(stand.map_pos_y) || 0;

                            const { left, top } = getTransformedCoordinates(posX, posY);

                            return (
                                <TouchableOpacity
                                    key={stand.id}
                                    style={[
                                        styles.markerContainer,
                                        { left, top }
                                    ]}
                                    onPress={() => navigation.navigate('EnterpriseDetail', { enterprise: stand })}
                                    activeOpacity={0.8}
                                >
                                    <View
                                        style={[
                                            styles.dot,
                                            {
                                                backgroundColor: colors.primary,
                                                borderColor: colors.surfaceContainerLowest
                                            }
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.markerText,
                                            {
                                                backgroundColor: colors.surfaceContainerLowest,
                                                color: colors.onSurface,
                                                borderColor: colors.surfaceContainerHighest
                                            }
                                        ]}
                                    >
                                        {stand.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScalableImageZoom>
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

    /* Header Fixe */
    header: {
        height: 64,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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

    /* Rotation CTA Header */
    rotateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 9999,
        gap: 6,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    rotateButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
    },

    /* Map & Markers */
    mapContainer: {
        width: '100%',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    markerContainer: {
        position: 'absolute',
        alignItems: 'center',
        transform: [{ translateX: -6 }, { translateY: -6 }],
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    markerText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 2,
        borderWidth: 1,
        elevation: 1,
    },
});