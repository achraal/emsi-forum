import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Text,
    SafeAreaView,
    StatusBar,
    TouchableOpacity
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';

import { MapStackProps } from '../../navigation/types';
import { useAppTheme } from '../../context/ThemeContext';

type Props = MapStackProps<'Map3D'>;
const SPLINE_SCENE_URL = process.env.EXPO_PUBLIC_SPLINE_SCENE_URL;

export default function Map3DScreen({ navigation }: Props) {
    const { colors, isDark } = useAppTheme();
    const [loading, setLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);
    const [key, setKey] = useState<number>(0);

    const handleRetry = () => {
        setHasError(false);
        setLoading(true);
        setKey(prev => prev + 1);
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
                        Immersion 3D Interactive
                    </Text>
                </View>
            </View>

            <View style={[styles.container, { backgroundColor: colors.surface }]}>
                {loading && !hasError && (
                    <View style={[styles.loaderContainer, { backgroundColor: colors.surface }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                            Chargement de la scène 3D...
                        </Text>
                    </View>
                )}

                {hasError ? (
                    <View style={styles.errorContainer}>
                        <View style={[styles.errorIconBox, { backgroundColor: colors.errorContainer }]}>
                            <MaterialIcons name="cloud-off" size={32} color={colors.error} />
                        </View>
                        <Text style={[styles.errorTitle, { color: colors.onSurface }]}>
                            Impossible de charger la vue 3D
                        </Text>
                        <Text style={[styles.errorSubtitle, { color: colors.onSurfaceVariant }]}>
                            Vérifiez votre connexion internet ou la configuration de la scène Spline.
                        </Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                            onPress={handleRetry}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="refresh" size={18} color={colors.onPrimary} />
                            <Text style={[styles.retryButtonText, { color: colors.onPrimary }]}>
                                Réessayer
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <WebView
                        key={key}
                        source={{ uri: SPLINE_SCENE_URL || '' }}
                        style={styles.webview}
                        onLoadEnd={() => setLoading(false)}
                        onError={() => {
                            setLoading(false);
                            setHasError(true);
                        }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsInlineMediaPlayback={true}
                    />
                )}
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
        position: 'relative',
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

    /* WebView & Loading */
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        gap: 12,
    },
    loadingText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
    },

    /* Error State */
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 12,
    },
    errorIconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    errorTitle: {
        fontFamily: 'Syne-Bold',
        fontSize: 18,
        textAlign: 'center',
    },
    errorSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        marginTop: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    retryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },
});