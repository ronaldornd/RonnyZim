import { create } from 'zustand';

export type AppName = 'loading' | 'genesis' | 'workspace' | 'identity' | 'vault' | 'hunter' | 'rndmind' | 'settings';

interface OSState {
    activeApp: AppName;
    userId: string | null;
    profileData: any | null;
    isInitialLoad: boolean;
    
    // Actions
    setActiveApp: (app: AppName) => void;
    setUserId: (id: string) => void;
    setProfileData: (data: any) => void;
    setInitialLoad: (loading: boolean) => void;
}

export const useOSStore = create<OSState>((set) => ({
    activeApp: 'loading',
    userId: null,
    profileData: null,
    isInitialLoad: true,

    setActiveApp: (app) => set({ activeApp: app }),
    setUserId: (id) => set({ userId: id }),
    setProfileData: (data) => set({ profileData: data }),
    setInitialLoad: (loading) => set({ isInitialLoad: loading }),
}));
