import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs/promises';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const capsDir = process.env.CAPS_DIR || '/caps';
    const keys = JSON.parse(
      await fs.readFile(`${capsDir}/keys.json`, 'utf8')
    );
    const did = keys['CompanyB'].did;
    const domain = (req.query.domain as string) || 'a.example.com';
    const port = Number(process.env.DATA_PORT) || 3000;
    const url = `http://${domain}:${port}/zcaps?controller=${encodeURIComponent(
      did
    )}`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json({ url, data });
  } catch (e: any) {
    res.status(500).json({ error: String(e) });
  }
}
