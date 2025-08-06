import type {NextApiRequest, NextApiResponse} from 'next';
import fs from 'node:fs/promises';
import {CAPABILITY_DIRECTORY, DATA_SERVER_PORT, KEYS_FILE_NAME, PORTS,} from '../../lib/constants';
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
        if (capability.allowedActions.includes('transform')) {
            datasetPath = `/${capability.caveats.protocol}.json`;
            datasetDomain = capability.caveats.targetDomain;
        } else {
            const target = new URL(capability.invocationTarget);
            datasetPath = target.pathname;
            datasetDomain = target.hostname;
        }
        const requestHeaders = {
            'capability-id': capability.id,
            'caller-did': clientDecentralizedIdentifier,
        };
        const url = `http://${datasetDomain}:${DATA_SERVER_PORT}${datasetPath}`;
        const serverResponse = await fetch(url, {headers: requestHeaders});
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
            requestHeaders,
            clientDecentralizedIdentifier,
        });
    } catch (e: any) {
        response.status(500).json({error: String(e)});
    }
}
