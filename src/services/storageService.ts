import { UserIdentity, VerifiableCredential } from '../types';
import { generateDID } from './cryptoService';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'choice_id_storage_v1';

const createGuestIdentity = (walletAddress: string): UserIdentity => ({
  address: walletAddress,
  did: generateDID(walletAddress),
  displayName: `Guest ${walletAddress}`,
  credentials: [],
  reputationScore: 0,
});

/**
 * Load identity from Supabase user_profiles by wallet address.
 * Falls back to localStorage if Supabase is unreachable.
 */
export const loadIdentity = async (walletAddress?: string): Promise<UserIdentity | null> => {
  // Try Supabase first
  try {
    const addr = walletAddress || localStorage.getItem('choice_wallet_address');
    if (!addr) {
      // Fallback: try localStorage cache
      return parseLocalIdentity(localStorage.getItem(STORAGE_KEY));
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', addr)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const identity: UserIdentity = {
        did: data.did,
        address: data.wallet_address,
        displayName: data.display_name || undefined,
        avatar: data.avatar || undefined,
        bio: data.bio || undefined,
        lastAnchorHash: data.last_anchor_hash || undefined,
        lastAnchorTimestamp: data.last_anchor_timestamp || undefined,
        credentials: Array.isArray(data.credentials) ? (data.credentials as unknown as VerifiableCredential[]) : [],
        reputationScore: data.reputation_score || 0,
      };
      // Cache locally
      localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
      return identity;
    }

    // No profile in DB — check localStorage cache
    return parseLocalIdentity(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    console.warn('Supabase load failed, falling back to localStorage', e);
    return parseLocalIdentity(localStorage.getItem(STORAGE_KEY));
  }
};

/**
 * Save identity to Supabase user_profiles (upsert by wallet_address).
 * Also caches to localStorage.
 */
export const saveIdentity = async (identity: UserIdentity | null) => {
  if (!identity) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const safeIdentity: UserIdentity = {
    ...identity,
    credentials: Array.isArray(identity.credentials) ? identity.credentials : [],
    reputationScore: typeof identity.reputationScore === 'number' ? identity.reputationScore : 0,
  };

  // Cache locally first
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeIdentity));
  } catch { /* ignore */ }

  // Save to Supabase
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: safeIdentity.address,
        did: safeIdentity.did,
        display_name: safeIdentity.displayName || null,
        avatar: safeIdentity.avatar || null,
        bio: safeIdentity.bio || null,
        last_anchor_hash: safeIdentity.lastAnchorHash || null,
        last_anchor_timestamp: safeIdentity.lastAnchorTimestamp || null,
        credentials: safeIdentity.credentials as any,
        reputation_score: safeIdentity.reputationScore,
      }, { onConflict: 'wallet_address' });

    if (error) throw error;
  } catch (e) {
    console.warn('Supabase save failed, localStorage cache preserved', e);
  }
};

/**
 * Clear only LOCAL identity data. Remote data is preserved for re-login.
 */
export const clearIdentity = async () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const addCredential = async (currentIdentity: UserIdentity, vc: VerifiableCredential): Promise<UserIdentity> => {
  const updated = {
    ...currentIdentity,
    credentials: [...currentIdentity.credentials, vc],
  };
  await saveIdentity(updated);
  return updated;
};

export const syncIdentity = async (identity: UserIdentity): Promise<void> => {
  await saveIdentity(identity);
};

/**
 * Load identity from Supabase by wallet address.
 * If found, return it. Otherwise create a guest identity and persist it.
 */
export const loadIdentityWithSync = async (walletAddress: string): Promise<UserIdentity | null> => {
  if (!walletAddress) return null;

  // Try loading from Supabase
  const remoteIdentity = await loadIdentity(walletAddress);
  if (remoteIdentity && remoteIdentity.address === walletAddress) {
    return remoteIdentity;
  }

  // No remote profile — create guest and save
  const guestIdentity = createGuestIdentity(walletAddress);
  await saveIdentity(guestIdentity);
  return guestIdentity;
};

// ── Helpers ──

const parseLocalIdentity = (raw: string | null): UserIdentity | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.address !== 'string' || typeof parsed.did !== 'string') return null;
    return {
      ...parsed,
      credentials: Array.isArray(parsed.credentials) ? parsed.credentials : [],
      reputationScore: typeof parsed.reputationScore === 'number' ? parsed.reputationScore : 0,
    } as UserIdentity;
  } catch {
    return null;
  }
};
