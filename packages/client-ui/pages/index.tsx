import {useEffect, useState} from 'react';
import {SCENARIOS} from '../lib/scenarios';
import {SOLUTION_DESCRIPTION, TASK_DESCRIPTION} from '../lib/info';

interface RunResult {
    status: number;
    responseBody: string;
    url: string;
    responseHeaders: Record<string, string>;
    capability: any;
    requestHeaders: Record<string, string>;
    datasetPath: string;
    port: number;
    clientDecentralizedIdentifier: string;
}

const EXECUTE_LABEL = 'Execute scenario on server and print the result';

export default function Home() {
    const [capabilitiesInfo, setCapabilitiesInfo] = useState<any>();
    useEffect(() => {
        fetch('/api/caps')
            .then((response) => response.json())
            .then(setCapabilitiesInfo);
    }, []);

    const [scenarioResults, setScenarioResults] = useState<
        Record<string, RunResult>
    >({});
    const executeScenario = async (id: string) => {
        const response = await fetch(`/api/run?id=${id}`);
        const resultData = await response.json();
        setScenarioResults((previousResults) => ({
            ...previousResults,
            [id]: resultData,
        }));
    };

    const [companyBIntrospectionData, setCompanyBIntrospectionData] =
        useState<any>(null);
    const fetchCompanyBIntrospection = async () => {
        const response = await fetch('/api/introspect');
        const resultData = await response.json();
        setCompanyBIntrospectionData(resultData);
    };

    return (
        <div className="flex min-h-screen">
            <div className="flex-1 p-4 space-y-6">
                <h1 className="text-3xl font-bold">ZCAP Demo UI</h1>

                <div className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
                    <input type="checkbox"/>
                    <div className="collapse-title text-xl font-medium">Task</div>
                    <div className="collapse-content whitespace-pre-wrap">
                        {TASK_DESCRIPTION}
                    </div>
                </div>

                <div className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
                    <input type="checkbox"/>
                    <div className="collapse-title text-xl font-medium">Solution Overview</div>
                    <div className="collapse-content whitespace-pre-wrap">
                        {SOLUTION_DESCRIPTION}
                    </div>
                </div>

                <section>
                    <h2 className="text-2xl font-semibold mb-2">Client C Scenarios</h2>
                    <div className="space-y-2">
                        {SCENARIOS.map((scenario) => (
                            <div
                                key={scenario.id}
                                className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box"
                            >
                                <input type="checkbox"/>
                                <div className="collapse-title text-xl font-medium">
                                    {scenario.id}: {scenario.description}
                                </div>
                                <div className="collapse-content space-y-2">
                                    <p>{scenario.detailedDescription}</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => executeScenario(scenario.id)}
                                    >
                                        {EXECUTE_LABEL}
                                    </button>
                                    {scenarioResults[scenario.id] && (
                                        <div className="space-y-1">
                                            <ol className="list-decimal list-inside text-sm">
                                                <li>
                                                    Loaded capability file <code>{scenario.id}.json</code>
                                                    and caller decentralized identifier{" "}
                                                    {
                                                        scenarioResults[scenario.id]
                                                            .clientDecentralizedIdentifier
                                                    }.
                                                </li>
                                                <li>
                                                    Sent request to
                                                    <code> {scenarioResults[scenario.id].url} </code>
                                                    (internal docker container domain+port) with headers shown below.
                                                </li>
                                                <li>
                                                    Server responded with status
                                                    {scenarioResults[scenario.id].status}.
                                                </li>
                                            </ol>
                                            <br/>
                                            <p className="text-lg font-bold">Request headers:</p>
                                            <pre className="overflow-x-auto text-xs">
                        {JSON.stringify(
                            scenarioResults[scenario.id].requestHeaders,
                            null,
                            2
                        )}
                      </pre>
                                            <br/>
                                            <p className="text-lg font-bold">Capability:</p>
                                            <pre className="overflow-x-auto text-xs">
                        {JSON.stringify(
                            scenarioResults[scenario.id].capability,
                            null,
                            2
                        )}
                      </pre>
                                            <br/>
                                            <p className="text-lg">Response body:</p>
                                            <pre className="overflow-x-auto text-xs font-bold">
                        {scenarioResults[scenario.id].responseBody}
                      </pre>
                                            <br/><br/>
                                            <p className="text-lg font-bold">Manual test:</p>
                                            <pre className="overflow-x-auto text-xs">
                        {`curl -H "capability-id: ${scenarioResults[scenario.id].requestHeaders['capability-id']}" -H "caller-did: ${scenarioResults[scenario.id].requestHeaders['caller-did']}" http://<droplet-ip>:${scenarioResults[scenario.id].port}${scenarioResults[scenario.id].datasetPath}`}
                      </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-2">Company B Introspection</h2>
                    <div className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
                        <input type="checkbox"/>
                        <div className="collapse-title text-xl font-medium">
                            B reads allowed capabilities
                        </div>
                        <div className="collapse-content space-y-2">
                            <p>
                                Company B asks the dataset server which capabilities it controls.
                            </p>
                            <button
                                className="btn btn-secondary"
                                onClick={fetchCompanyBIntrospection}
                            >
                                {EXECUTE_LABEL}
                            </button>
                            {companyBIntrospectionData && (
                                <div className="space-y-1">
                                    <ol className="list-decimal list-inside text-sm">
                                        <li>
                                            Loaded Company B decentralized identifier
                                            <code>{" "}
                                                {companyBIntrospectionData.companyBDecentralizedIdentifier}
                                            </code>
                                            {" "} from keys.
                                        </li>
                                        <li>
                                            Sent request to
                                            <code> {companyBIntrospectionData.url} </code>
                                            asking for capabilities.
                                        </li>
                                        <li>Server returned the JSON below.</li>
                                    </ol>
                                    <pre className="overflow-x-auto text-xs">
                    {JSON.stringify(
                        companyBIntrospectionData.data,
                        null,
                        2
                    )}
                  </pre>
                                    <p className="text-lg font-bold">Manual test:</p>
                                    <pre className="overflow-x-auto text-xs">
                    {`curl http://<droplet-ip>:${companyBIntrospectionData.port}/zcaps?controller=${encodeURIComponent(companyBIntrospectionData.companyBDecentralizedIdentifier)}`}
                  </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
            <aside className="w-1/3 p-4 bg-base-200 overflow-y-scroll">
                <h2 className="text-xl font-semibold">Datasets &amp; Capabilities</h2>
                {capabilitiesInfo ? (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-bold">Keys</h3>
                            <pre className="overflow-x-auto text-xs">
                {JSON.stringify(capabilitiesInfo.keys, null, 2)}
              </pre>
                        </div>
                        <div>
                            <h3 className="font-bold">Capabilities</h3>
                            {(capabilitiesInfo.capabilities as any[]).map((capability, capIndex) => (
                                <>
                                    <h3 className="font-bold">{capabilitiesInfo.capabilityFileNames[capIndex]}</h3>
                                    <pre className="overflow-x-auto text-xs">{JSON.stringify(capability, null, 2)}</pre>
                                </>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p>Loading…</p>
                )}
            </aside>
        </div>
    );
}
