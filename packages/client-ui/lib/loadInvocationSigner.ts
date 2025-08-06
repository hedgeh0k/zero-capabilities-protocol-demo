// @ts-ignore
import {Ed25519VerificationKey2020} from '@digitalbazaar/ed25519-verification-key-2020';

export async function loadInvocationSigner(
    actorRecord: {
        did: string;
        keyPair: {
            // keep the full key object shape as persisted by issuer
            id?: string;
            controller?: string;
            publicKeyMultibase: string;
            privateKeyMultibase: string;
            type?: string;
        };
    }
) {
    // Prefer the persisted key id (critical for verification)
    const keyMaterial = {
        id: actorRecord.keyPair.id ?? `${actorRecord.did}#key-1`, // fallback only if truly missing
        controller: actorRecord.keyPair.controller ?? actorRecord.did,
        publicKeyMultibase: actorRecord.keyPair.publicKeyMultibase,
        privateKeyMultibase: actorRecord.keyPair.privateKeyMultibase,
        type: actorRecord.keyPair.type ?? 'Ed25519VerificationKey2020',
    };
    const keyPair = await Ed25519VerificationKey2020.from(keyMaterial);
    return keyPair.signer();
}
