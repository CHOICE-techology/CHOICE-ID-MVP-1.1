import { UserIdentity, VerifiableCredential } from '../types';
import { LocalVault } from '../lib/vault/localVault';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'choice_id_storage_v1';

export const loadIdentity = async (): Promise<UserIdentity | null> => {
  try {
    const db = await LocalVault.getInstance();
    const res = await db.query('SELECT * FROM identities LIMIT 1');
    if (res.rows.length === 0) return null;

    const row = res.rows[0] as any;
    const identity: UserIdentity = {
      did: row.did,
      address: row.address,
      displayName: row.display_name,
      avatar: row.avatar,
      bio: row.bio,
      lastAnchorHash: row.last_anchor_hash,
      lastAnchorTimestamp: row.last_anchor_timestamp,
      credentials: [],
      reputationScore: 0 // Will be calculated by caller or during load
    };

    // Load credentials
    const credsRes = await db.query('SELECT * FROM credentials WHERE did = $1', [identity.did]);
    identity.credentials = credsRes.rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      issuer: r.issuer,
      issuanceDate: r.issuance_date,
      credentialSubject: r.subject_data
    }));

    return identity;
  } catch (e) {
    console.warn("Vault unavailable, falling back to localStorage", e);
    // Fallback to localStorage silently — no scary error toast
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
};

export const saveIdentity = async (identity: UserIdentity) => {
  try {
    const db = await LocalVault.getInstance();
    
    // UPSERT identity
    await db.query(`
      INSERT INTO identities (did, address, display_name, avatar, bio, last_anchor_hash, last_anchor_timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (did) DO UPDATE SET
        address = EXCLUDED.address,
        display_name = EXCLUDED.display_name,
        avatar = EXCLUDED.avatar,
        bio = EXCLUDED.bio,
        last_anchor_hash = EXCLUDED.last_anchor_hash,
        last_anchor_timestamp = EXCLUDED.last_anchor_timestamp
    `, [
      identity.did, 
      identity.address, 
      identity.displayName, 
      identity.avatar, 
      identity.bio,
      identity.lastAnchorHash,
      identity.lastAnchorTimestamp
    ]);

    // Update credentials - for simplicity in this MVP, we replace all
    await db.query('DELETE FROM credentials WHERE did = $1', [identity.did]);
    for (const vc of identity.credentials) {
      await db.query(`
        INSERT INTO credentials (id, did, type, issuer, issuance_date, subject_data)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [vc.id, identity.did, vc.type, vc.issuer, vc.issuanceDate, vc.credentialSubject]);
    }

    // Keep localStorage in sync for now as a backup (Phase 4 requirement)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch (e) {
    toast({
      title: "Storage Error",
      description: "Failed to save your identity locally.",
      variant: "destructive",
    });
  }
};

export const clearIdentity = async () => {
  try {
    const db = await LocalVault.getInstance();
    await db.query('DELETE FROM credentials');
    await db.query('DELETE FROM identities');
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear identity", e);
  }
};

export const addCredential = async (currentIdentity: UserIdentity, vc: VerifiableCredential): Promise<UserIdentity> => {
  const updated = {
    ...currentIdentity,
    credentials: [...currentIdentity.credentials, vc]
  };
  await saveIdentity(updated);
  return updated;
};

export const syncIdentity = async (identity: UserIdentity): Promise<void> => {
  await saveIdentity(identity);
};

export const loadIdentityWithSync = async (walletAddress: string): Promise<UserIdentity | null> => {
  const localIdentity = await loadIdentity();
  if (localIdentity && localIdentity.address === walletAddress) {
    return localIdentity;
  }
  return null;
};
