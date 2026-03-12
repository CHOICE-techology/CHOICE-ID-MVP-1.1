import { UserIdentity, VerifiableCredential } from '../types';
import { LocalVault } from '../lib/vault/localVault';
import { generateDID } from './cryptoService';

const STORAGE_KEY = 'choice_id_storage_v1';

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

const createGuestIdentity = (walletAddress: string): UserIdentity => ({
  address: walletAddress,
  did: generateDID(walletAddress),
  displayName: `Guest ${walletAddress}`,
  credentials: [],
  reputationScore: 0,
});

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
      reputationScore: 0,
    };

    const credsRes = await db.query('SELECT * FROM credentials WHERE did = $1', [identity.did]);
    identity.credentials = credsRes.rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      issuer: r.issuer,
      issuanceDate: r.issuance_date,
      credentialSubject: r.subject_data,
    }));

    return identity;
  } catch (e) {
    console.warn('Vault unavailable, falling back to localStorage', e);
    return parseLocalIdentity(localStorage.getItem(STORAGE_KEY));
  }
};

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

  try {
    const db = await LocalVault.getInstance();

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
      safeIdentity.did,
      safeIdentity.address,
      safeIdentity.displayName,
      safeIdentity.avatar,
      safeIdentity.bio,
      safeIdentity.lastAnchorHash,
      safeIdentity.lastAnchorTimestamp,
    ]);

    await db.query('DELETE FROM credentials WHERE did = $1', [safeIdentity.did]);

    for (const vc of safeIdentity.credentials) {
      await db.query(`
        INSERT INTO credentials (id, did, type, issuer, issuance_date, subject_data)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [vc.id, safeIdentity.did, vc.type, vc.issuer, vc.issuanceDate, vc.credentialSubject]);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeIdentity));
  } catch (e) {
    console.warn('Vault save failed, using localStorage fallback', e);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeIdentity));
    } catch {
      // Ignore storage errors to avoid UI crashes
    }
  }
};

export const clearIdentity = async () => {
  try {
    const db = await LocalVault.getInstance();
    await db.query('DELETE FROM credentials');
    await db.query('DELETE FROM identities');
  } catch (e) {
    console.warn('Vault clear failed, clearing local fallback only', e);
  } finally {
    localStorage.removeItem(STORAGE_KEY);
  }
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

export const loadIdentityWithSync = async (walletAddress: string): Promise<UserIdentity | null> => {
  if (!walletAddress) return null;

  const localIdentity = await loadIdentity();
  if (localIdentity && localIdentity.address === walletAddress) {
    return localIdentity;
  }

  const guestIdentity = createGuestIdentity(walletAddress);
  await saveIdentity(guestIdentity);
  return guestIdentity;
};
