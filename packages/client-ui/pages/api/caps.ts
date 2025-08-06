import type {NextApiRequest, NextApiResponse} from 'next';
import fs from 'node:fs/promises';
import {CAPABILITY_DIRECTORY, KEYS_FILE_NAME,} from '../../lib/constants';
import {CAPABILITY_FILE_NAMES} from '../../lib/scenarios';

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    try {
        const capabilityDirectory = CAPABILITY_DIRECTORY;
        const keysJson = await fs.readFile(
            `${capabilityDirectory}/${KEYS_FILE_NAME}`,
            'utf8'
        );
        const keys = JSON.parse(keysJson);
        const capabilityFiles = CAPABILITY_FILE_NAMES;
        const capabilities: any[] = [];
        const capabilityFileNames: any[] = [];
        for (const fileName of capabilityFiles) {
            const rawJson = await fs.readFile(
                `${capabilityDirectory}/${fileName}`,
                'utf8'
            );
            capabilities.push(JSON.parse(rawJson) as any);
            capabilityFileNames.push(fileName);
        }
        response.status(200).json({keys, capabilities, capabilityFileNames});
    } catch (e: any) {
        response.status(500).json({error: String(e)});
    }
}
