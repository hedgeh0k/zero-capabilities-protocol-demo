export const CAPABILITY_DIRECTORY = process.env.CAPABILITY_DIRECTORY || '/caps';
export const KEYS_FILE_NAME = 'keys.json';
export const DATA_SERVER_PORT = Number(process.env.DATA_PORT) || 3000;
export const PORTS = new Map<string, number>([["a.example.com", 4100], ["b.example.com", 4200]]);
