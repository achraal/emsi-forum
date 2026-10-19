import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Palette de couleurs - Mode Clair (Charte EMSI)
export const LIGHT_COLORS = {
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
    tertiaryFixed: '#ffdad3',
    onTertiaryFixedVariant: '#8c1700',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onSurface: '#171d19',
    onSurfaceVariant: '#3e4a3f',
    outline: '#6e7a6e',
    outlineVariant: '#bdcabb',
    starActive: '#f59e0b',
    starInactive: '#d1d5db',
    inverseSurface: 'rgba(44, 50, 45, 0.4)',
};

// Palette de couleurs - Mode Sombre (Charte EMSI adaptatif)
export const DARK_COLORS = {
    primary: '#6edd8a',
    primaryContainer: '#005225',
    onPrimary: '#003917',
    surface: '#101411',
    surfaceContainerLowest: '#0b0f0c',
    surfaceContainerLow: '#181d19',
    surfaceContainer: '#1c211d',
    surfaceContainerHigh: '#262b27',
    surfaceContainerHighest: '#313631',
    secondary: '#8cd79d',
    secondaryContainer: '#005227',
    onSecondaryContainer: '#a8f4b7',
    tertiary: '#ffb4a4',
    tertiaryFixed: '#8c1700',
    onTertiaryFixedVariant: '#ffdad3',
    error: '#ffb4ab',
    errorContainer: '#93000a',
    onSurface: '#e1e4df',
    onSurfaceVariant: '#c1c9be',
    outline: '#8b9389',
    outlineVariant: '#414941',
    starActive: '#fbbf24',
    starInactive: '#4b5563',
    inverseSurface: 'rgba(0, 0, 0, 0.7)',
};

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    isDark: boolean;
    colors: typeof LIGHT_COLORS;
}

const STORAGE_KEY = '@app_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    useEffect(() => {
        // Charger le thème sauvegardé dans AsyncStorage
        AsyncStorage.getItem(STORAGE_KEY).then((savedMode) => {
            if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
                setThemeModeState(savedMode as ThemeMode);
            }
        });
    }, []);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
        AsyncStorage.setItem(STORAGE_KEY, mode).catch((err) =>
            console.error('Erreur de sauvegarde du thème :', err)
        );
    };

    // Déterminer si le mode sombre est actif
    const isDark = useMemo(() => {
        if (themeMode === 'system') {
            return systemColorScheme === 'dark';
        }
        return themeMode === 'dark';
    }, [themeMode, systemColorScheme]);

    // Retourner la palette de couleurs dynamique
    const colors = useMemo(() => {
        return isDark ? DARK_COLORS : LIGHT_COLORS;
    }, [isDark]);

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Hook personnalisé pour consommer le thème facilement dans vos composants
export const useAppTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useAppTheme doit être utilisé à l’intérieur d’un ThemeProvider');
    }
    return context;
};