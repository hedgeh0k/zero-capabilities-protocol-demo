import { useEffect, useState } from 'react';

interface RunResult {
  status: number;
  body: string;
  url: string;
  headers: Record<string, string>;
  cap: any;
}

const SCENARIOS = [
  {
    id: 'abc-A',
    desc: 'Company A keeps dataset "AB" for Company B; C should be denied.',
  },
  {
    id: 'abc-B',
    desc: 'Dataset "AC" is delegated by A to B and further to C for reading.',
  },
  {
    id: 'abc-C',
    desc: 'A lets B transform "AB" via x-to-y; only A and B may read the result.',
  },
  {
    id: 'abc-D',
    desc: 'A lets B transform "AB" via x-to-z and delegate the result to C.',
  },
];

export default function Home() {
  const [capsData, setCapsData] = useState<any>();
  useEffect(() => {
    fetch('/api/caps').then((r) => r.json()).then(setCapsData);
  }, []);

  const [results, setResults] = useState<Record<string, RunResult>>({});
  const runScenario = async (id: string) => {
    const res = await fetch(`/api/run?id=${id}`);
    const data = await res.json();
    setResults((r) => ({ ...r, [id]: data }));
  };

  const [bData, setBData] = useState<any>(null);
  const fetchB = async () => {
    const res = await fetch('/api/introspect');
    const data = await res.json();
    setBData(data);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-4 space-y-6">
        <h1 className="text-3xl font-bold">ZCAP Demo UI</h1>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Client C Scenarios</h2>
          <div className="space-y-2">
            {SCENARIOS.map((s) => (
              <div
                key={s.id}
                className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box"
              >
                <input type="checkbox" />
                <div className="collapse-title text-xl font-medium">
                  {s.id}: {s.desc}
                </div>
                <div className="collapse-content space-y-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => runScenario(s.id)}
                  >
                    Run
                  </button>
                  {results[s.id] && (
                    <div className="space-y-1">
                      <p className="font-bold">Status: {results[s.id].status}</p>
                      <p className="text-sm break-all">URL: {results[s.id].url}</p>
                      <pre className="overflow-x-auto text-xs">
                        {JSON.stringify(results[s.id].cap, null, 2)}
                      </pre>
                      <pre className="overflow-x-auto text-xs">
                        {results[s.id].body}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">B and A Only</h2>
          <div className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
            <input type="checkbox" />
            <div className="collapse-title text-xl font-medium">
              B reads allowed capabilities
            </div>
            <div className="collapse-content space-y-2">
              <p>Queries dataset server introspection for Company B.</p>
              <button className="btn btn-secondary" onClick={fetchB}>
                Run
              </button>
              {bData && (
                <pre className="overflow-x-auto text-xs">
                  {JSON.stringify(bData, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Test on DigitalOcean</h2>
          <p>
            Use <code>scripts/deploy-digital-ocean.sh</code> to start all services
            on a droplet. Then open
            <code> http://&lt;droplet-ip&gt;:4500 </code> to reach this UI.
          </p>
        </section>
      </div>
      <aside className="w-1/3 p-4 bg-base-200 overflow-y-scroll">
        <h2 className="text-xl font-semibold">Datasets &amp; Capabilities</h2>
        {capsData ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold">Keys</h3>
              <pre className="overflow-x-auto text-xs">
                {JSON.stringify(capsData.keys, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-bold">Capabilities</h3>
              <pre className="overflow-x-auto text-xs">
                {JSON.stringify(capsData.caps, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p>Loading…</p>
        )}
      </aside>
    </div>
  );
}
