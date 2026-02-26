import { UserIdentity, VerifiableCredential } from '../types';

const STORAGE_KEY = 'choice_id_storage_v1';

export const loadIdentity = (): UserIdentity | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to load identity", e);
    return null;
  }
};

export const saveIdentity = (identity: UserIdentity) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch (e) {
    console.error("Failed to save identity", e);
  }
};

export const clearIdentity = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const addCredential = (currentIdentity: UserIdentity, vc: VerifiableCredential): UserIdentity => {
  const updated = {
    ...currentIdentity,
    credentials: [...currentIdentity.credentials, vc]
  };
  saveIdentity(updated);
  return updated;
};
