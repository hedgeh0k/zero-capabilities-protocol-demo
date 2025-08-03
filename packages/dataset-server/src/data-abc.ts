/** --------------------------------------------------------------
 * Hard‑coded JSON blobs kept in memory.
 *
 * For the purposes of this demo no network or disk I/O is used to
 * retrieve datasets.  Everything is compiled into this module at
 * build time.  In a production system you would fetch real data
 * from storage, apply transformations and sign the outputs.
 * TODO-PROD – fetch from real storage and sign transform outputs.
 * -------------------------------------------------------------- */

/** A map from request paths to serialized JSON payloads.  Keys must
 * begin with a slash.  See README for descriptions of each file. */
export const DATA: Record<string, string> = {
  '/ab.json': JSON.stringify({ dataset: 'AB', note: 'readable by B' }),
  '/ac.json': JSON.stringify({ dataset: 'AC', note: 'delegated to C' }),
  '/x-to-y.json': JSON.stringify({
    dataset: 'AB',
    transform: 'x-to-y output',
    readers: ['CompanyA', 'CompanyB'],
  }),
  '/x-to-z.json': JSON.stringify({
    dataset: 'AB',
    transform: 'x-to-z output',
    readers: ['UserC'],
  }),
};