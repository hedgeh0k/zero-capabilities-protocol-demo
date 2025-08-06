// Mapping of our three actors and their associated DNS domains.  The
// labels must match the keys used in the issuer to index into the
// generated keys object.
export const PARTY = {
    CompanyA: {domain: 'a.example.com'},
    CompanyB: {domain: 'b.example.com'},
    UserC: {domain: 'c.example.com'},
} as const;

export const DATASET = {
    ab: `https://${PARTY.CompanyA.domain}/ab.json`,
    ac: `https://${PARTY.CompanyA.domain}/ac.json`,
    // Name of the protocol used to generate the first derived dataset.
    protoY: 'x-to-y',
    // Name of the protocol used to generate the second derived dataset.
    protoZ: 'x-to-z',
} as const;
