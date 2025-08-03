/** --------------------------------------------------------------
 * Single‑source constants.
 * Change domains or add protocols here – rest of code stays DRY.
 * -------------------------------------------------------------- */

// Mapping of our three actors and their associated DNS domains.  The
// labels must match the keys used in the issuer to index into the
// generated keys object.
export const PARTY = {
    CompanyA: {domain: 'a.example.com'},
    CompanyB: {domain: 'b.example.com'},
    UserC: {domain: 'c.example.com'},
} as const;

// Information about the dataset and supported transform protocols.  The
// "root" is the canonical URI of the primary dataset.  Derived
// protocol names are used both in caveats and to name the static
// transform output files in the dataset server.
export const DATASET = {
    // The absolute URL of the dataset under Company A.  Because this
    // demo does not actually resolve DNS we use the domain name solely
    // as a label; the client UI maps the domain to a port when
    // constructing requests.
    root: 'https://a.example.com/ab.json',
    // Name of the protocol used to generate the first derived dataset.
    protoY: 'x-to-y',
    // Name of the protocol used to generate the second derived dataset.
    protoZ: 'x-to-z',
} as const;
