import type {NextApiRequest, NextApiResponse} from 'next';
import fs from 'node:fs/promises';
import {CAPABILITY_DIRECTORY, DATA_SERVER_PORT, KEYS_FILE_NAME,} from '../../lib/constants';

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    try {
        const capabilityDirectory = CAPABILITY_DIRECTORY;
        const keys = JSON.parse(
            await fs.readFile(`${capabilityDirectory}/${KEYS_FILE_NAME}`, 'utf8')
        );
        const companyBDecentralizedIdentifier = keys['CompanyB'].did;
        const domain = (request.query.domain as string);
        const url = `http://${domain}:${DATA_SERVER_PORT}/zcaps?controller=${encodeURIComponent(
            companyBDecentralizedIdentifier
        )}`;
        const serverResponse = await fetch(url);
        const data = await serverResponse.json();
        response
            .status(200)
            .json({
                url,
                data,
                companyBDecentralizedIdentifier,
                port: 4200,
            });
    } catch (e: any) {
        response.status(500).json({error: String(e)});
    }
}
