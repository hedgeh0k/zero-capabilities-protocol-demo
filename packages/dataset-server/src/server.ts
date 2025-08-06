/** --------------------------------------------------------------
 * Universal ZCAP‑protected API.
 *
 * This server hosts one party’s datasets. It supports two kinds of
 * routes: fetching a dataset file and introspection of issued
 * capabilities. All requests must include a Capability‑Id header
 * containing the capability identifier and a Caller‑Did header
 * indicating who is making the request. The server verifies that
 * the supplied capability exists, that the caller is authorised
 * according to the capability rules and caveats, and then serves
 * the requested payload.
 *
 * Simplifications:
 *   • The DATA map is compiled in - no I/O, good for demo.
 *   • Capability revocation/expiry is not implemented → see TODO-PROD.
 *   • Linked data proofs and signature validation are omitted.
 *
 * TODO-PROD - add revocation/expiry checks, integrate storage,
 *             validate signatures and support HTTPS via a reverse proxy.
 * -------------------------------------------------------------- */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from "node:path";
import {fileURLToPath, URL} from 'node:url';
// Suppress type checking for imports from compiled common modules.
// @ts-ignore
import {log} from '../../common/dist/logger.js';

async function loadData(): Promise<Record<string, string>> {
    const DATA_DIR = process.env.DATA_DIR || path.resolve(
        path.dirname(fileURLToPath(import.meta.url)), '../data');

    const stack = [DATA_DIR];
    const map: Record<string, string> = {};

    while (stack.length) {
        const dir = stack.pop()!;
        const dirents = await fs.readdir(dir, {withFileTypes: true});
        for (const d of dirents) {
            const full = path.join(dir, d.name);
            if (d.isDirectory()) {
                stack.push(full);
            } else if (d.isFile() && d.name.endsWith('.json')) {
                const raw = await fs.readFile(full, 'utf8');
                map[`/${d.name}`] = raw;    // key = "/file.json"
            }
        }
    }
    return map;
}

// Load all capability files from the shared /caps volume.  We build
// two maps: one keyed by capability identifier and another keyed
// by the controller DID to support the /zcaps introspection route.
async function loadCaps(retries = 20, delayMs = 250) {
    const dir = process.env.CAPS_DIR || '/caps';
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const files = await fs.readdir(dir);
            const byId: Record<string, any> = {};
            const byController: Record<string, any[]> = {};
            for (const f of files) {
                if (f === 'keys.json' || !f.endsWith('.json')) continue;
                const raw = await fs.readFile(`${dir}/${f}`, 'utf8');
                const cap = JSON.parse(raw);
                log('📄', `loaded capability ${f}`);
                byId[cap.id] = cap;
                const list = byController[cap.controller] || [];
                list.push(cap);
                byController[cap.controller] = list;
            }
            log('📦', `loaded ${Object.keys(byId).length} caps from ${dir}`);
            return {byId, byController};
        } catch {
            log('⏳', `waiting for caps in ${dir} (attempt ${attempt + 1})`);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
    throw new Error(`unable to load capabilities from ${dir}`);
}

// Load keys to build a mapping from DID to human friendly label.  The
// client UI uses these labels to display results and the server uses
// them when interpreting reader caveats.  Without this mapping the
// server would not know which caveat entry corresponds to a given
// DID.
async function loadDidToLabel(retries = 20, delayMs = 250) {
    const capsDir = process.env.CAPS_DIR || '/caps';
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const raw = await fs.readFile(`${capsDir}/keys.json`, 'utf8');
            const keys = JSON.parse(raw);
            const didToLabel: Record<string, string> = {};
            for (const label of Object.keys(keys)) {
                didToLabel[keys[label].did] = label;
            }
            log('📗', `loaded keys.json from ${capsDir}`);
            return didToLabel;
        } catch {
            log('⏳', `waiting for keys.json in ${capsDir} (attempt ${attempt + 1})`);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
    throw new Error(`unable to load keys.json from ${capsDir}`);
}

async function main() {
    const DOMAIN = process.env.DOMAIN || 'unknown.example.com';
    const PORT = Number(process.env.PORT) || 3000;
    const DATA = await loadData();
    log('📚', `data module loaded with ${Object.keys(DATA).length} files`);
    const {byId: capsById, byController: capsByController} = await loadCaps();
    const didToLabel = await loadDidToLabel();

    const server = http.createServer(async (req, res) => {
        try {
            if (!req.url) {
                res.statusCode = 400;
                res.end('bad request');
                return;
            }
            // Introspection route: return all capabilities issued to a
            // controller DID.  Example: /zcaps?controller=<did>
            if (req.method === 'GET' && req.url.startsWith('/zcaps')) {
                const url = new URL(req.url, 'http://localhost');
                const controllerDid = url.searchParams.get('controller');
                if (!controllerDid) {
                    res.statusCode = 400;
                    res.end('missing controller');
                    return;
                }
                const caps = capsByController[controllerDid] || [];
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify(caps, null, 2));
                return;
            }

            if (req.method !== 'GET') {
                res.statusCode = 405;
                res.end('method not allowed');
                return;
            }
            const url = new URL(req.url, 'http://localhost');
            const file = url.pathname; // e.g. /ab.json
            // Only serve files contained in the DATA map.
            if (!(file in DATA)) {
                log('🔴', `file ${file} missing`);
                res.statusCode = 404;
                res.end('not found');
                return;
            }
            // Extract headers (case insensitive).  Node normalises
            // incoming headers to lower case.
            const capId = req.headers['capability-id'] as string | undefined;
            const callerDid = req.headers['caller-did'] as string | undefined;
            // Verbose verification log.
            log('🔍', `VERIFY cap ${capId} for ${callerDid} on ${DOMAIN}${file}`);
            if (!capId || !callerDid) {
                log('🔴', 'missing capability-id or caller-did header');
                res.statusCode = 400;
                res.end('missing headers');
                return;
            }
            const cap = capsById[capId];
            if (!cap) {
                log('🔴', `cap ${capId} NOT found`);
                res.statusCode = 403;
                res.end('capability not recognised');
                return;
            }
            // Determine whether the request targets a transform output.
            const isTransform = file.startsWith('/x-to-');
            // Derive the label of the caller from the DID for reader caveats.
            const callerLabel = didToLabel[callerDid];

            if (!isTransform) {
                // Non transform - require read action and exact invocation target.
                if (!cap.allowedActions.includes('read')) {
                    log('🔴', 'DENY read not allowed');
                    res.statusCode = 403;
                    res.end('action not allowed');
                    return;
                }
                // Compare the path of the invocation target with the request.
                try {
                    const targetUrl = new URL(cap.invocationTarget);
                    if (targetUrl.pathname !== file) {
                        log('🔴', 'DENY invocation target mismatch');
                        res.statusCode = 403;
                        res.end('invocation target mismatch');
                        return;
                    }
                } catch {
                    // If invocationTarget is not a valid URL treat as mismatch.
                    log('🔴', 'DENY invalid invocation target');
                    res.statusCode = 403;
                    res.end('invalid invocation target');
                    return;
                }
                // The caller must be the controller of the capability for non‑transform reads.
                if (cap.controller !== callerDid) {
                    log('🔴', 'DENY controller mismatch');
                    res.statusCode = 403;
                    res.end('not authorised');
                    return;
                }
                // Success - serve the payload.
                log('🟢', `ALLOW read ${file} on ${DOMAIN}`);
                res.setHeader('content-type', 'application/json');
                res.end(DATA[file]);
                return;
            }
            // Transform - require transform action and protocol caveat.
            if (!cap.allowedActions.includes('transform')) {
                log('🔴', 'DENY transform not allowed');
                res.statusCode = 403;
                res.end('transform not allowed');
                return;
            }
            // const expectedProtocol = file.startsWith('/x-to-y') ? 'x-to-y' : 'x-to-z';
            const protoMatch = file.match(/^\/(.+)\.json$/);
            const expectedProtocol = protoMatch ? protoMatch[1] : '';
            if (!cap.caveats || cap.caveats.protocol !== expectedProtocol) {
                log('🔴', 'DENY protocol mismatch');
                res.statusCode = 403;
                res.end('protocol mismatch');
                return;
            }
            // Determine who may fetch the transform.  Either the controller
            // (the party performing the transform) or any party listed in
            // the readers caveat.  We translate the caller DID to a label
            // before comparing because readers are stored as labels.
            const allowedReaders: string[] = cap.caveats.readers || [];
            const controllerLabel = didToLabel[cap.controller];
            if (callerDid !== cap.controller && (!callerLabel || !allowedReaders.includes(callerLabel))) {
                log('🔴', 'DENY reader mismatch');
                res.statusCode = 403;
                res.end('not authorised to read transform');
                return;
            }
            // Success - serve the transform payload.
            log('🟢', `ALLOW transform ${file} on ${DOMAIN}`);
            res.setHeader('content-type', 'application/json');
            res.end(DATA[file]);
        } catch (err: any) {
            const msg = err?.message || String(err);
            log('❗', `internal error: ${msg}`, err);
            res.statusCode = 500;
            res.end('internal error');
        }
    });

    server.listen(PORT, () => {
        log('🌐', `dataset server ready on ${DOMAIN}:${PORT}`);
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
