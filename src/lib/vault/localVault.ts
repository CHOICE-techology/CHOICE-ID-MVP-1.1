import { PGlite } from '@electric-sql/pglite';

export class LocalVault {
  private static instance: PGlite | null = null;
  private static initFailed = false;

  static async getInstance(): Promise<PGlite> {
    if (this.initFailed) {
      throw new Error('PGlite initialization previously failed');
    }
    if (!this.instance) {
      try {
        this.instance = new PGlite('idb://choiceid-vault');
        await this.initializeSchema(this.instance);
      } catch (e) {
        console.warn('PGlite IDB init failed, trying in-memory fallback', e);
        try {
          this.instance = new PGlite();
          await this.initializeSchema(this.instance);
        } catch (e2) {
          console.warn('PGlite in-memory init also failed', e2);
          this.initFailed = true;
          this.instance = null;
          throw e2;
        }
      }
    }
    return this.instance;
  }

  private static async initializeSchema(db: PGlite) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS identities (
        did TEXT PRIMARY KEY,
        address TEXT,
        display_name TEXT,
        avatar TEXT,
        bio TEXT,
        last_anchor_hash TEXT,
        last_anchor_timestamp TEXT,
        metadata JSONB DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        did TEXT NOT NULL,
        type TEXT[] NOT NULL,
        issuer TEXT NOT NULL,
        issuance_date TEXT NOT NULL,
        subject_data JSONB NOT NULL,
        FOREIGN KEY (did) REFERENCES identities(did) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS rewards (
        id TEXT PRIMARY KEY,
        address TEXT NOT NULL,
        amount INTEGER NOT NULL,
        reason TEXT,
        timestamp TEXT NOT NULL
      );
    `);
  }
}

export const vault = LocalVault;

export const getVault = async () => {
  return LocalVault.getInstance();
};
