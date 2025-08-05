import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs/promises';

const LIST = ['abc-A', 'abc-B', 'abc-C', 'abc-D'] as const;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (typeof id !== 'string' || !LIST.includes(id as any)) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }
  try {
    const capsDir = process.env.CAPS_DIR || '/caps';
    const capJSON = await fs.readFile(`${capsDir}/${id}.json`, 'utf8');
    const cap = JSON.parse(capJSON);
    const keys = JSON.parse(
      await fs.readFile(`${capsDir}/keys.json`, 'utf8')
    );
    const clientDid = keys['UserC'].did;
    let path: string;
    let domain: string;
    if (cap.allowedActions.includes('transform')) {
      path = `/${cap.caveats.protocol}.json`;
      domain = cap.caveats.targetDomain;
    } else {
      const t = new URL(cap.invocationTarget);
      path = t.pathname;
      domain = t.hostname;
    }
    const port = Number(process.env.DATA_PORT) || 3000;
    const url = `http://${domain}:${port}${path}`;
    const response = await fetch(url, {
      headers: {
        'capability-id': cap.id,
        'caller-did': clientDid,
      },
    });
    const body = await response.text();
    const headers = Object.fromEntries(response.headers.entries());
    res.status(200).json({
      id,
      url,
      status: response.status,
      headers,
      body,
      cap,
    });
  } catch (e: any) {
    res.status(500).json({ error: String(e) });
  }
}
