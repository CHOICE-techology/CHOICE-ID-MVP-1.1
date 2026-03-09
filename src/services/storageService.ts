import { UserIdentity, VerifiableCredential } from '../types';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'choice_id_storage_v1';
const MAX_LOCAL_CREDENTIALS = 20; // Prevent quota overflow

// ─── localStorage helpers (cache / fallback) ───

/** Trim credentials to prevent localStorage quota overflow */
const trimForStorage = (identity: UserIdentity): UserIdentity => {
  if (identity.credentials.length <= MAX_LOCAL_CREDENTIALS) return identity;
  return {
    ...identity,
    credentials: identity.credentials.slice(-MAX_LOCAL_CREDENTIALS),
  };
};

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
    const trimmed = trimForStorage(identity);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // If still too large, clear and retry with minimal data
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        const minimal = { ...identity, credentials: identity.credentials.slice(-5) };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
      } catch {
        console.warn('localStorage completely full, skipping local cache');
      }
    } else {
      console.error("Failed to save identity", e);
    }
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

// ─── Database persistence ───

export const loadIdentityFromDB = async (walletAddress: string): Promise<UserIdentity | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) {
      console.error('Failed to load identity from DB:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      address: data.wallet_address,
      did: data.did,
      displayName: data.display_name ?? undefined,
      avatar: data.avatar ?? undefined,
      bio: data.bio ?? undefined,
      credentials: (data.credentials as any[]) ?? [],
      reputationScore: data.reputation_score ?? 0,
      lastAnchorHash: data.last_anchor_hash ?? undefined,
      lastAnchorTimestamp: data.last_anchor_timestamp ? Number(data.last_anchor_timestamp) : undefined,
    };
  } catch (e) {
    console.error('Failed to load identity from DB:', e);
    return null;
  }
};

export const saveIdentityToDB = async (identity: UserIdentity): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          wallet_address: identity.address,
          did: identity.did,
          display_name: identity.displayName ?? null,
          avatar: identity.avatar ?? null,
          bio: identity.bio ?? null,
          credentials: identity.credentials as any,
          reputation_score: identity.reputationScore,
          last_anchor_hash: identity.lastAnchorHash ?? null,
          last_anchor_timestamp: identity.lastAnchorTimestamp ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_address' }
      );

    if (error) {
      console.error('Failed to save identity to DB:', error.message);
    }
  } catch (e) {
    console.error('Failed to save identity to DB:', e);
  }
};

export const syncIdentity = async (identity: UserIdentity): Promise<void> => {
  saveIdentity(identity);
  await saveIdentityToDB(identity);
};

export const loadIdentityWithSync = async (walletAddress: string): Promise<UserIdentity | null> => {
  const dbIdentity = await loadIdentityFromDB(walletAddress);
  if (dbIdentity) {
    saveIdentity(dbIdentity);
    return dbIdentity;
  }

  const localIdentity = loadIdentity();
  if (localIdentity && localIdentity.address === walletAddress) {
    await saveIdentityToDB(localIdentity);
    return localIdentity;
  }

  return null;
};
