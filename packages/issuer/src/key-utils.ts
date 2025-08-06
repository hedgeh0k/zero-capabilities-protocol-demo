// @ts-ignore – ESM module has no typings yet
import {driver as didKeyDriver} from '@digitalbazaar/did-method-key';
// @ts-ignore
import {Ed25519VerificationKey2020} from '@digitalbazaar/ed25519-verification-key-2020';
// @ts-ignore
import {ZcapClientSigner} from '@digitalbazaar/ezcap';

export interface PartyKeys {
    did: string;
    keyPair: any; // full crypto-ld keyPair
    invocationSigner: ZcapClientSigner;
}

export async function generateKeys(): Promise<PartyKeys> {
    /* 1 create a fresh Ed25519 key pair */
    const keyPair = await Ed25519VerificationKey2020.generate();

    /* 2 bootstrap the did:key driver for Ed25519 multibase header z6Mk */
    const driver = didKeyDriver();
    driver.use({
        multibaseMultikeyHeader: 'z6Mk',            // fixed header for Ed25519
        fromMultibase: Ed25519VerificationKey2020.from
    });

    /* 3 — embed the SAME key pair in a fresh did:key document */
    const {didDocument, methodFor} =
        await driver.fromKeyPair({verificationKeyPair: keyPair});

    /* align IDs so EZCAP can match map-key ⇆ key.id */
    const vm = methodFor({purpose: 'capabilityInvocation'});
    keyPair.id = vm.id;
    keyPair.controller = didDocument.id;
    return {
        did: didDocument.id,
        keyPair,
        invocationSigner: keyPair.signer()
    };
}
