import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface Enterprise {
    id: number | string;
    name: string;
    logo_url?: string;
    category?: string;
    description?: string;
    target_profiles?: string;
    map_pos_x?: number | string | null;
    map_pos_y?: number | string | null;
}

// 1. Routes du TabNavigator principal
export type MainTabParamList = {
    Accueil: undefined;
    Entreprises: undefined;
    Plan: undefined;
    Profil: undefined;
    Dashboard: undefined;
    Settings: undefined;
    Scan: undefined;
};

// 2. Routes du MapNavigator (Stack)
export type MapStackParamList = {
    Map2D: undefined;
    Map3D: undefined;
};

// 3. Stack global / d'authentification
export type RootStackParamList = {
    MainTabs: { screen?: keyof MainTabParamList };
    Announcements: undefined;
    Satisfaction: undefined;
    EnterpriseDetail: { enterprise: Enterprise };
    ScanBadge: undefined;
    Settings: undefined;
    Login: undefined;
    Signup: undefined;
};

// 4. Helpers de typage pour les props des écrans
export type MainTabScreenProps<T extends keyof MainTabParamList> =
    CompositeScreenProps<
        BottomTabScreenProps<MainTabParamList, T>,
        NativeStackScreenProps<RootStackParamList>
    >;

export type MapStackProps<T extends keyof MapStackParamList> =
    NativeStackScreenProps<MapStackParamList, T>;