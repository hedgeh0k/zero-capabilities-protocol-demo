# ZCAP ABC Demo

This project implements a minimalist demonstration of object
capabilities (ZCAPs) for controlled data sharing between three
parties: **Company A**, **Company B** and **User C**.  The goal is to
encode a handful of legal agreements as signed capabilities and
validate those capabilities at runtime without a central authority.

## Repository layout

```
zcap-abc-demo/
├── docker-compose.yml      # defines four services (issuer, party‑a,
│                           # party‑b and client UI) and a shared volume
└── packages/
    ├── common/             # helpers (keys, logger, zcap wrapper)
    ├── issuer/             # generates 3 keys + 4 capabilities
    ├── dataset-server/     # generic API (A and B reuse it)
    └── client-ui/          # acts as User C
```

Each package is self contained with its own `package.json`,
`tsconfig.json` and TypeScript sources under `src/`.  Running `npm run
build` in a package compiles the TypeScript to ES modules in the
corresponding `dist/` directory.

### Common

The `common` package provides three helpers:

* `logger.ts` – prints messages with emoji tags to aid debugging.
* `key-utils.ts` – generates Ed25519 key pairs and example DIDs.
* `zcap-utils.ts` – constructs simplified capabilities and handles
  delegation logic.  It does **not** implement linked data proofs.

### Issuer

The `issuer` package runs once at container start.  It generates a
key pair for each party and constructs four capabilities representing
the legal agreements listed below.  The keys and capabilities are
written into the shared `/caps` volume so that the dataset servers and
client UI can read them without any network calls.

### Dataset server

The dataset server hosts a small collection of JSON files embedded at
build time.  Requests must include two HTTP headers:

| Header         | Description                                                    |
|---------------|----------------------------------------------------------------|
| `Capability‑Id` | The ID of the capability being invoked                        |
| `Caller‑Did`   | The DID of the caller (used for reader checks)                |

Based on the capability’s allowed actions and caveats the server will
either return the requested dataset or respond with a 403.  An
introspection route `/zcaps?controller=<did>` returns all capabilities
issued to a given controller DID.

### Client UI

The client UI listens on port 8080 (exposed as 4500 via
docker‑compose).  It reads the keys and capabilities from the shared
volume, lists each scenario on the home page and, when clicked,
retrieves the dataset through the appropriate server.  The UI signs
requests by including the caller’s DID in the request headers – the
private key never leaves the server.

## Legal agreements and scenarios

The demo encodes four legal agreements using four capabilities:

| Scenario | Capability file | Legal agreement                                                                | Expected from client UI |
|---------|-----------------|--------------------------------------------------------------------------------|-------------------------|
| **A**   | `abc-A.json`    | Company A owns dataset X, Company B may read it.  This capability does **not** allow delegation. | 🔴 403 (Client = C) |
| **B**   | `abc-B.json`    | Company A ➔ Company B (read + delegate) ➔ User C may read dataset X.                             | 🟢 200, sees AB json |
| **C**   | `abc-C.json`    | Company A allows Company B to process dataset X via protocol *x‑to‑y*.  Only Company A and Company B may read the derived dataset. | 🔴 403 |
| **D**   | `abc-D.json`    | Company A allows Company B to process dataset X via protocol *x‑to‑z*.  Only User C may read the derived dataset.                | 🟢 200, sees x‑to‑z json |

### How to run

Build and start the demo with Docker:

```sh
docker compose up --build
```

Navigate to [http://localhost:4500](http://localhost:4500) and click
through the scenarios.  Terminal logs will show emoji‑tagged messages
like “VERIFY cap …”, “ALLOW …” and “DENY …” explaining the
authorization decisions.

### Production gap checklist

Several important aspects are deliberately omitted from this demo for
brevity.  The code marks these with `TODO‑PROD` comments where
appropriate:

* **Secure key storage** – keys should live in an HSM or secret vault.
* **Capability revocation/expiry** – implement a revocation list and
  expiration checks in the dataset server.
* **Signed transform outputs** – a micro‑service could perform
  transforms and sign results instead of serving static JSON.
* **HTTPS termination** – use a reverse proxy such as Caddy or
  Traefik to provide TLS for all services.