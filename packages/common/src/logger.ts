/** --------------------------------------------------------------
 * Tiny logger helper – runtime output uses emoji tags.
 * Each log entry is prefixed by a unicode arrow and a short tag.
 * Do not remove or change the emoji markers – they make it easy
 * to scan the output when debugging.
 * -------------------------------------------------------------- */
export const log = (tag: string, msg: string): void => {
  console.log(`➤ ${tag.padEnd(6)} ${msg}`);
};