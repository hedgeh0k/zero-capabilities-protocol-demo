export interface Scenario {
  id: string;
  description: string;
  detailedDescription: string;
  datasetPath: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'abc-A',
    description: 'Company A keeps dataset "AB" for Company B; C should be denied.',
    detailedDescription:
      'Client C tries to read dataset "ab.json" from Company A using a capability intended for Company B. The request should be rejected.',
    datasetPath: '/ab.json',
  },
  {
    id: 'abc-B',
    description: 'Dataset "AC" is delegated by A to B and further to C for reading.',
    detailedDescription:
      'Client C uses a capability delegated through Company B to fetch dataset "ac.json" from Company A. This should succeed.',
    datasetPath: '/ac.json',
  },
  {
    id: 'abc-C',
    description: 'A lets B transform "AB" via x-to-y; only A and B may read the result.',
    detailedDescription:
      'Client C attempts to access derived dataset "x-to-y.json". The capability only allows Company B to transform and read, so Client C should be denied.',
    datasetPath: '/x-to-y.json',
  },
  {
    id: 'abc-D',
    description: 'A lets B transform "AB" via x-to-z and delegate the result to C.',
    detailedDescription:
      'Client C reads derived dataset "x-to-z.json" using a delegated capability. The request should succeed.',
    datasetPath: '/x-to-z.json',
  },
];

export const SCENARIO_IDS = SCENARIOS.map((s) => s.id);
export const CAPABILITY_FILE_NAMES = SCENARIOS.map((s) => `${s.id}.json`);
