/** --------------------------------------------------------------
 * One‑shot DID + Ed25519 key generation.
 *
 * In a production deployment you should never generate or store
 * private keys on the local filesystem.  Instead use a secure
 * hardware module (HSM) or secret vault.  This demo embeds keys
 * directly in JSON purely to illustrate the ZCAP flow.
 * TODO-PROD – store private keys in an HSM or Vault, never on
 *             local disk.
 * -------------------------------------------------------------- */
import { randomUUID, generateKeyPairSync } from 'crypto';

/** The shape of a party’s keys as returned by generateKeys(). */
export interface PartyKeys {
  /** The Decentralized Identifier (DID) representing this actor. */
  did: string;
  /** A simple key pair.  Keys are base64 encoded for portability. */
  keyPair: {
    publicKey: string;
    privateKey: string;
  };
}

/**
 * Generate a DID and an Ed25519 key pair.  The DID uses the
 * "did:example" method and a random UUID to avoid collisions.  The
 * keys are exported as DER encoded buffers and converted to base64
 * strings for ease of persistence.
 */
export async function generateKeys(): Promise<PartyKeys> {
  // Generate a key pair synchronously.  Node’s crypto module
  // guarantees that the underlying primitives are secure.
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  // Create a random DID using the example method.  In a real
  // deployment you would register a DID using an appropriate method.
  const did = `did:example:${randomUUID()}`;
  // Export keys as DER encoded binary and convert to base64.
  const pubBuf = publicKey.export({ format: 'der', type: 'spki' }) as Buffer;
  const privBuf = privateKey.export({ format: 'der', type: 'pkcs8' }) as Buffer;
  return {
    did,
    keyPair: {
      publicKey: pubBuf.toString('base64'),
      privateKey: privBuf.toString('base64'),
    },
  };
}