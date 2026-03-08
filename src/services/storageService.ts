import { UserIdentity, VerifiableCredential } from '../types';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'choice_id_storage_v1';

// ─── localStorage helpers (cache / fallback) ───

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

// ─── Database persistence ───

/**
 * Load a user profile from the database by wallet address.
 * Returns null if not found.
 */
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

/**
 * Save (upsert) a user profile to the database.
 * Uses wallet_address as the conflict key.
 */
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

/**
 * Sync identity: save to both localStorage (cache) and database (source of truth).
 */
export const syncIdentity = async (identity: UserIdentity): Promise<void> => {
  saveIdentity(identity); // localStorage cache
  await saveIdentityToDB(identity); // database
};

/**
 * Load identity with DB as source of truth, localStorage as fallback.
 */
export const loadIdentityWithSync = async (walletAddress: string): Promise<UserIdentity | null> => {
  // Try DB first (source of truth)
  const dbIdentity = await loadIdentityFromDB(walletAddress);
  if (dbIdentity) {
    // Update localStorage cache
    saveIdentity(dbIdentity);
    return dbIdentity;
  }

  // Fallback to localStorage
  const localIdentity = loadIdentity();
  if (localIdentity && localIdentity.address === walletAddress) {
    // Migrate localStorage data to DB
    await saveIdentityToDB(localIdentity);
    return localIdentity;
  }

  return null;
};
