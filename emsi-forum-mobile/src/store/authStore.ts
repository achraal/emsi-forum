import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
    id: number | string;
    email: string;
    role: 'admin' | 'student' | string;
    first_name?: string;
    last_name?: string;
    qr_code_token?: string; // <-- Ajouté
    [key: string]: any;
}

interface AuthState {
    token: string | null;
    user: User | null;
    setToken: (token: string, user?: User | null) => Promise<void>;
    setUser: (user: User | null) => Promise<void>;
    logout: () => Promise<void>;
    loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,

    setToken: async (token: string, user: User | null = null) => {
        await AsyncStorage.setItem('userToken', token);
        if (user) {
            await AsyncStorage.setItem('userData', JSON.stringify(user));
        }
        set({ token, user: user !== undefined ? user : undefined });
    },

    setUser: async (user: User | null) => {
        if (user) {
            await AsyncStorage.setItem('userData', JSON.stringify(user));
        } else {
            await AsyncStorage.removeItem('userData');
        }
        set({ user });
    },

    logout: async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        set({ token: null, user: null });
    },

    loadToken: async () => {
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            const storedUser = await AsyncStorage.getItem('userData');

            if (storedToken) {
                set({
                    token: storedToken,
                    user: storedUser ? JSON.parse(storedUser) : null,
                });
            }
        } catch (error) {
            console.error("Erreur lors du chargement du token :", error);
        }
    },
}));