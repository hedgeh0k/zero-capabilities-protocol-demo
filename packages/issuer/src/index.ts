/** --------------------------------------------------------------
 * Generates 4 capabilities (scenarios A–D) and 3 key pairs.
 * Writes everything to /caps for other containers to mount.
 *
 * This script is intentionally self contained.  It does not rely
 * on external network calls or third party ZCAP libraries.  The
 * capabilities produced here are plain JSON objects that capture
 * delegation chains and caveats as described in the assignment.
 *
 * Scenario overview:
 *   A — CompanyA owns dataset X, CompanyB may read it (no delegation).
 *   B — CompanyA ➔ CompanyB (delegate) ➔ UserC may read it.
 *   C — CompanyA allows CompanyB to transform X using protocol x-to-y; readers CompanyA and CompanyB.
 *   D — CompanyA allows CompanyB to transform X using protocol x-to-z; reader UserC.
 *
 * TODO-PROD – implement real signature handling via EZCAP library and
 *             store private keys in a secure vault.
 * -------------------------------------------------------------- */

import fs from 'node:fs/promises';
import {randomUUID} from 'crypto';
import {DATASET, PARTY} from './config.js';
// The following imports reference compiled JavaScript from the common
// package.  TypeScript will not find declarations for these modules
// without additional configuration, therefore we suppress the
// warnings using ts-ignore.  In this demo only runtime behaviour is
// important.
// @ts-ignore
import {generateKeys} from '../../common/dist/key-utils.js';
// @ts-ignore
import {Capability, zcapClient} from '../../common/dist/zcap-utils.js';
// @ts-ignore
import {log} from '../../common/dist/logger.js';

// Helper labels for ease of reference when building capabilities.
const A = 'CompanyA';
const B = 'CompanyB';
const C = 'UserC';

async function main(): Promise<void> {
    // Generate three sets of keys, one for each actor.  The keys are
    // stored in a simple object keyed by the actor label.
    const keys: Record<string, any> = {};
    for (const label of Object.keys(PARTY)) {
        keys[label] = await generateKeys();
        log('🔑', `generated key for ${label}`);
    }

    // Construct a root capability owned by CompanyA.  All other
    // capabilities delegate from this root.  The allowed actions on
    // the root include read, delegate and transform so that
    // subsequent delegations can restrict the rights appropriately.
    const rootCap: Capability = {
        id: `urn:uuid:${randomUUID()}`,
        invoker: keys[A].did,
        controller: keys[A].did,
        invocationTarget: DATASET.root,
        allowedActions: ['read', 'delegate', 'transform'],
    };

    // Build the four scenario capabilities.  Each call to zcapClient
    // returns a new capability signed (in the real sense) by the
    // delegator’s key.  Here we simply record the delegator’s DID in
    // the invoker field.
    const caps: Record<string, any> = {};

    // Scenario A: CompanyA ➔ CompanyB may read X.  CompanyB may not
    // delegate further.
    caps['abc-A'] = zcapClient(keys[A]).delegate({
        capability: rootCap,
        controller: keys[B].did,
        allowedActions: ['read'],
    });
    log('📝', 'scenario A capability issued');

    // Scenario B: CompanyA ➔ CompanyB (read + delegate) ➔ UserC may read X.
    // First delegate from A to B with both read and delegate rights.
    const bDelegate = zcapClient(keys[A]).delegate({
        capability: rootCap,
        controller: keys[B].did,
        allowedActions: ['read', 'delegate'],
    });
    // Then B delegates read rights to C.  In a real system the parent
    // capability provided here would be bDelegate.  We include the
    // parent property on the derived capability to record this.
    caps['abc-B'] = zcapClient(keys[B]).delegate({
        capability: bDelegate,
        controller: keys[C].did,
        allowedActions: ['read'],
    });
    log('📝', 'scenario B capability issued');

    // Scenario C: CompanyA ➔ CompanyB may transform X using protocol x-to-y.
    // Readers are CompanyA and CompanyB.
    caps['abc-C'] = zcapClient(keys[A]).delegate({
        capability: rootCap,
        controller: keys[B].did,
        allowedActions: ['transform'],
        caveats: {
            protocol: DATASET.protoY,
            readers: [A, B],
        },
    });
    log('📝', 'scenario C capability issued');

    // Scenario D: CompanyA ➔ CompanyB may transform X using protocol x-to-z.
    // Reader is UserC.
    caps['abc-D'] = zcapClient(keys[A]).delegate({
        capability: rootCap,
        controller: keys[B].did,
        allowedActions: ['transform'],
        caveats: {
            protocol: DATASET.protoZ,
            readers: [C],
        },
    });
    log('📝', 'scenario D capability issued');

    // Ensure the caps directory exists then write keys and capabilities.
    // Determine where to write the caps.  In docker the path is /caps
    // mounted as a volume; in a development environment you can set
    // CAPS_DIR to override this location (for example "./caps").
    const capsDir = process.env.CAPS_DIR || '/caps';
    await fs.mkdir(capsDir, {recursive: true});
    await fs.writeFile(`${capsDir}/keys.json`, JSON.stringify(keys, null, 2));
    for (const [file, cap] of Object.entries(caps)) {
        await fs.writeFile(`${capsDir}/${file}.json`, JSON.stringify(cap, null, 2));
    }
    log('📦️', 'keys + 4 capabilities stored');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
