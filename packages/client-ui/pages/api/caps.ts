import type {NextApiRequest, NextApiResponse} from 'next';
import fs from 'node:fs/promises';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const capsDir = process.env.CAPS_DIR || '/caps';
        const keysRaw = await fs.readFile(`${capsDir}/keys.json`, 'utf8');
        const keys = JSON.parse(keysRaw);
        const files = ['abc-A.json', 'abc-B.json', 'abc-C.json', 'abc-D.json'];
        const caps: any[] = [];
        for (const f of files) {
            const raw = await fs.readFile(`${capsDir}/${f}`, 'utf8');
            caps.push(JSON.parse(raw) as any);
        }
        res.status(200).json({keys, caps});
    } catch (e: any) {
        res.status(500).json({error: String(e)});
    }
}
