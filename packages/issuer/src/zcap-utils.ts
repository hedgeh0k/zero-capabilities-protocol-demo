// @ts-ignore
import {ZcapClient} from '@digitalbazaar/ezcap';
// // @ts-ignore
// import {CapabilityDelegation} from '@digitalbazaar/zcap';
// @ts-ignore
import {Ed25519Signature2020} from '@digitalbazaar/ed25519-signature-2020';
// @ts-ignore
import jsigs from 'jsonld-signatures';

import type {PartyKeys} from './key-utils.js';

export function zcapClient(keys: PartyKeys) {
    const client = new ZcapClient({
        SuiteClass: Ed25519Signature2020,
        invocationSigner: keys.invocationSigner,
        // capabilityDelegationSigner: keys.invocationSigner,
        delegationSigner: keys.invocationSigner,
        didDocument: {id: keys.did},
        // keyPairs: new Map([[keys.keyPair.id, keys.keyPair]])
    });

    // TODO: [bug] Fix the delegation logic for caveats handling
    // return {
    //     async delegate(
    //         {caveats, ...opts}: {
    //             capability: Record<string, any> | string;
    //             controller: string;
    //             invocationTarget?: string;
    //             allowedActions: string[];
    //             caveats?: Record<string, any>;
    //         }
    //     ) {
    //         // 1) Ask the library to *build* (but not sign) a delegated skeleton.
    //         const unsigned = await client.delegate({
    //             ...opts,
    //             // Prevent the library from signing yet by passing our own Suite later
    //             SuiteClass: Ed25519Signature2020
    //         });
    //
    //         // 2) Inject caveats (if any) before the proof is created.
    //         if (caveats) {
    //             unsigned.caveats = caveats;
    //         }
    //
    //         // 3) Re-sign with the delegator’s key so the caveats are covered.
    //         const {documentLoader} = client;
    //         return await jsigs.sign(unsigned, {
    //             documentLoader,
    //             suite: new Ed25519Signature2020({signer: keys.invocationSigner}),
    //             purpose: new CapabilityDelegation({
    //                 parentCapability: opts.capability
    //             })
    //         });
    //     }
    // };

    return {
        async delegate(options: {
            capability: Record<string, any> | string;
            controller: string;
            invocationTarget?: string;
            allowedActions: string[];
            caveats?: Record<string, any>;
        }) {
            return client.delegate(options);
        }

    };
}
