import type {NextApiRequest, NextApiResponse} from 'next';
import fs from 'node:fs/promises';
// @ts-ignore
import {signCapabilityInvocation} from '@digitalbazaar/http-signature-zcap-invoke';

import {loadInvocationSigner} from '../../lib/loadInvocationSigner';
import {CAPABILITY_DIRECTORY, DATA_SERVER_PORT, KEYS_FILE_NAME, PORTS} from '../../lib/constants';
import {SCENARIO_IDS} from '../../lib/scenarios';

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    const {id: scenarioId} = request.query;
    if (typeof scenarioId !== 'string' || !SCENARIO_IDS.includes(scenarioId)) {
        response.status(400).json({error: 'invalid id'});
        return;
    }
    try {
        const capabilityDirectory = CAPABILITY_DIRECTORY;
        const capabilityJSON = await fs.readFile(
            `${capabilityDirectory}/${scenarioId}.json`,
            'utf8'
        );
        const capability = JSON.parse(capabilityJSON);
        const keyData = JSON.parse(
            await fs.readFile(
                `${capabilityDirectory}/${KEYS_FILE_NAME}`,
                'utf8'
            )
        );
        const clientDecentralizedIdentifier = keyData['UserC'].did;

        let datasetPath: string;
        let datasetDomain: string;
        if (
            capability.allowedAction.includes('transform') &&
            capability.caveats?.protocol &&
            capability.caveats?.targetDomain
        ) {
            // For transform zcaps, caveats tell us where the derived dataset lives.
            datasetPath = `/${capability.caveats.protocol}.json`; // e.g. '/x-to-y.json'
            datasetDomain = capability.caveats.targetDomain;        // e.g. 'b.example.com'
        } else {
            // Plain read (or transform without caveats) - fall back to the target URL.
            const target = new URL(capability.invocationTarget);
            datasetPath = target.pathname;
            datasetDomain = target.hostname;
        }

        const invocationSigner = await loadInvocationSigner(keyData['UserC']);
        const url = `http://${datasetDomain}:${DATA_SERVER_PORT}${datasetPath}`;
        const signedHeaders = await signCapabilityInvocation({
            url,
            method: 'GET',
            headers: {},
            capability,
            capabilityAction: capability.allowedAction.includes('transform')
                ? 'transform'
                : 'read',
            invocationSigner,
        });
        /* for human-readable debug info keep the two convenience headers */
        const headersForClient = {};
        headersForClient['capability-id'] = capability.id;
        headersForClient['caller-did'] = clientDecentralizedIdentifier;

        const serverResponse = await fetch(url, {headers: headersForClient});

        const responseBody = await serverResponse.text();
        const responseHeaders = Object.fromEntries(
            serverResponse.headers.entries()
        );
        response.status(200).json({
            scenarioId,
            url,
            datasetPath,
            port: PORTS.get(datasetDomain),
            status: serverResponse.status,
            responseHeaders,
            responseBody,
            capability,
            requestHeaders: signedHeaders,
            clientDecentralizedIdentifier,
        });
    } catch (e: any) {
        console.log("Failed to run", e);
        response.status(500).json({error: JSON.stringify(e)});
    }
}
