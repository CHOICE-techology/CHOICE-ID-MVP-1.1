import { create } from 'zustand';
import { UserIdentity, VerifiableCredential } from '@/types';
import { saveIdentity, loadIdentity } from '@/services/storageService';
import { calculateIdentityScore } from '@/services/scoreEngine';
import { getPersonaForIdentity } from '@/services/personaService';

interface ChoiceState {
  choiceBalance: number;
  incrementBalance: (amount: number) => void;
  
  isWalletModalOpen: boolean;
  setWalletModalOpen: (isOpen: boolean) => void;

  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isRehydrating: boolean;
  authError: string | null;
  userIdentity: UserIdentity | null;
  identityScore: number;
  
  setConnectionState: (state: Partial<ChoiceState>) => void;
  setUserIdentity: (identity: UserIdentity | null) => void;
  setIdentityScore: (score: number) => void;
  addCredentialAction: (vc: VerifiableCredential) => void;
  rehydrate: () => Promise<void>;
}

export const useChoiceStore = create<ChoiceState>((set, get) => ({
  choiceBalance: 0,
  incrementBalance: (amount) => set((state) => ({ choiceBalance: state.choiceBalance + amount })),
  
  isWalletModalOpen: false,
  setWalletModalOpen: (isOpen) => set({ isWalletModalOpen: isOpen }),

  address: null,
  isConnected: false,
  isConnecting: false,
  isRehydrating: true,
  authError: null,
  userIdentity: null,
  identityScore: 0,

  setConnectionState: (newState) => set((state) => ({ ...state, ...newState })),

  rehydrate: async () => {
    set({ isRehydrating: true });
    try {
      const identity = await loadIdentity();
      if (identity) {
        const score = calculateIdentityScore(identity.credentials);
        set({
          userIdentity: identity,
          address: identity.address,
          identityScore: score,
          isConnected: true,
        });
      } else {
        set({
          userIdentity: null,
          address: null,
          identityScore: 0,
          isConnected: false,
        });
      }
    } finally {
      set({ isRehydrating: false });
    }
  },
  

  setUserIdentity: (identity) => {
    if (identity) {
      identity.aiPersona = getPersonaForIdentity(identity);
    }
    const score = identity ? calculateIdentityScore(identity.credentials) : 0;
    set({ userIdentity: identity, address: identity?.address || null, identityScore: score, isConnected: Boolean(identity) });
    if (identity) {
      saveIdentity(identity);
    }
  },

  setIdentityScore: (score) => set({ identityScore: score }),

  addCredentialAction: (vc) => {
    const { userIdentity } = get();
    if (!userIdentity) return;

    const updatedIdentity = {
      ...userIdentity,
      credentials: [...userIdentity.credentials, vc]
    };
    
    updatedIdentity.aiPersona = getPersonaForIdentity(updatedIdentity);
    const newScore = calculateIdentityScore(updatedIdentity.credentials);
    set({ userIdentity: updatedIdentity, identityScore: newScore });
    saveIdentity(updatedIdentity);
  },
}));

// Optional: External subscriber for absolute persistence safety
useChoiceStore.subscribe((state, prevState) => {
  if (state.userIdentity && state.userIdentity !== prevState.userIdentity) {
    // Already handled in actions, but this ensures any direct 'set' calls are also persisted
    // saveIdentity(state.userIdentity);
  }
});
