import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lecture directe de la variable d'environnement avec une valeur par défaut de secours
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.11.118:8000';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;