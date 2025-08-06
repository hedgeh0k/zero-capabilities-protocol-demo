/**
 * Generates 4 capabilities (scenarios A–D) and 3 key pairs.
 * Writes everything to /caps for other containers to mount.
 *
 * This script is intentionally self-contained. The
 * capabilities produced here are plain JSON objects that capture
 * delegation chains and caveats as described in the assignment.
 *
 * Scenario overview:
 *   A — CompanyA owns dataset X, CompanyB may read it (no delegation).
 *   B — CompanyA ➔ CompanyB (delegate) ➔ UserC may read it.
 *   C — CompanyA allows CompanyB to transform X using protocol x-to-y; readers CompanyA and CompanyB.
 *   D — CompanyA allows CompanyB to transform X using protocol x-to-z; reader UserC.
 **/

import fs from 'node:fs/promises';
import {DATASET, PARTY} from './config.js';
import {generateKeys} from './key-utils.js';
import {zcapClient} from './zcap-utils.js';
import {log} from './logger.js';

// Helper labels for ease of reference when building capabilities.
const A = 'CompanyA';
const B = 'CompanyB';
const C = 'UserC';

async function main(): Promise<void> {
    // Generate three sets of keys, one for each actor. The keys are
    // stored in a simple object keyed by the actor label.
    const keys: Record<string, any> = {};
    for (const label of Object.keys(PARTY)) {
        keys[label] = await generateKeys();
        log('🔑', `generated key for ${label}`);
    }

    // Build the four scenario capabilities.  Each call to zcapClient
    // returns a new capability signed (in the real sense) by the
    // delegator’s key.  Here we simply record the delegator’s DID in
    // the invoker field.
    const caps: Record<string, any> = {};

    // Scenario A: CompanyA ➔ CompanyB may read X.  CompanyB may not
    // delegate further.
    caps['abc-A'] = await zcapClient(keys[A]).delegate({
        // capability: rootCap,
        capability: DATASET.ab,
        invocationTarget: DATASET.ab,
        controller: keys[B].did,
        allowedActions: ['read'],
    });
    log('📝', 'scenario A capability issued');

    // Scenario B: CompanyA ➔ CompanyB (read + delegate) ➔ UserC may read X.
    // First delegate from A to B with both read and delegate rights.
    const bDelegate = await zcapClient(keys[A]).delegate({
        capability: DATASET.ac,
        invocationTarget: DATASET.ac,
        controller: keys[B].did,
        allowedActions: ['read', 'delegate'],
    });
    // Then B delegates read rights to C. In a real system the parent
    // capability provided here would be bDelegate. We include the
    // parent property on the derived capability to record this.
    caps['abc-B'] = await zcapClient(keys[B]).delegate({
        capability: bDelegate,
        controller: keys[C].did,
        allowedActions: ['read'],
    });
    log('📝', 'scenario B capability issued');

    // Scenario C: CompanyA ➔ CompanyB may transform X using protocol x-to-y.
    // Readers are CompanyA and CompanyB.
    caps['abc-C'] = await zcapClient(keys[A]).delegate({
        capability: DATASET.ab,
        invocationTarget: DATASET.ab,
        controller: keys[B].did,
        allowedActions: ['transform'],
        caveats: {
            protocol: DATASET.protoY,
            readers: [keys[A].did, keys[B].did],
            targetDomain: PARTY.CompanyB.domain
        },
    });
    log('📝', 'scenario C capability issued');

    // Scenario D: CompanyA ➔ CompanyB may transform X using protocol x-to-z.
    // Reader is UserC.
    caps['abc-D'] = await zcapClient(keys[A]).delegate({
        capability: DATASET.ab,
        invocationTarget: DATASET.ab,
        controller: keys[B].did,
        allowedActions: ['transform'],
        caveats: {
            protocol: DATASET.protoZ,
            readers: [keys[C].did],
            targetDomain: PARTY.CompanyB.domain
        },
    });
    log('📝', 'scenario D capability issued');

    // Ensure the caps directory exists then write keys and capabilities.
    // Determine where to write the caps. In docker the path is /caps
    // mounted as a volume; in a development environment you can set
    // CAPS_DIR to override this location (for example "./caps").
    const capsDir = process.env.CAPS_DIR || '/caps';
    await fs.mkdir(capsDir, {recursive: true});
    const persistableKeys = Object.fromEntries(
        Object.entries(keys).map(([label, k]: any) => [
            label,
            {
                did: k.did,
                keyPair: {
                    id: k.keyPair.id,
                    controller: k.keyPair.controller,
                    type: k.keyPair.type,
                    publicKeyMultibase: k.keyPair.publicKeyMultibase,
                    privateKeyMultibase: k.keyPair.privateKeyMultibase,
                },
            },
        ])
    );
    await fs.writeFile(`${capsDir}/keys.json`, JSON.stringify(persistableKeys, null, 2));
    for (const [file, cap] of Object.entries(caps)) {
        await fs.writeFile(`${capsDir}/${file}.json`, JSON.stringify(cap, null, 2));
    }
    log('📦️', 'keys + 4 capabilities stored');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
