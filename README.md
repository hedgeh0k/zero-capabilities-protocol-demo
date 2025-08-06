# Zero Capabilities Protocol Demo

This repository showcases a minimal end‑to‑end example of using
[zcap](https://w3c-ccg.github.io/zcap-spec/) object capabilities for
controlled data sharing. Three actors are involved:

* **CompanyA** – owns the source dataset
* **CompanyB** – performs transforms on the dataset
* **UserC** – consumes data that B is authorised to release

The demo encodes the agreements between these parties as signed JSON
capabilities and validates them at request time.

## Repository layout

```
zero-capabilities-protocol-demo/
├── docker-compose.yml      # four services + shared /caps volume
└── packages/
    ├── issuer/             # generates keys and capabilities
    ├── dataset-server/     # generic API server reused by A and B
    └── client-ui/          # Next.js app acting as User C
```

Each package contains its own `package.json`, `tsconfig.json` and
TypeScript sources in `src/`. Run `npm run build` within a package to
compile to ESM in its `dist/` folder.

### Issuer

Runs once at container start to create key pairs for the three parties
and to mint four capabilities that correspond to the scenarios below.
The resulting files are written to the shared `/caps` volume so that the
servers and client UI can read them without any network calls.

### Dataset server

Serves embedded JSON datasets and validates incoming requests against the stored capabilities and verifies signatures.

An additional introspection endpoint is provided for debugging: `GET /zcaps?controller=<did>` returns the list of
capabilities issued to the supplied controller DID.

### Client UI

A small **Next.js** + **DaisyUI** application that exercises the scenarios. It listens on port `8080` (exposed as `4500`
via`docker-compose`) and reads keys and capabilities from the shared volume.
Each scenario uses `fetch` to call the dataset server, **signing** requests on the fly using the caller's key.

## Scenarios

Four legal agreements are modelled as capabilities:

| Scenario | Capability file | Agreement                                                                 | UI result  |
|----------|-----------------|---------------------------------------------------------------------------|------------|
| **A**    | `abc-A.json`    | A owns dataset X; B may read it. No delegation allowed.                   | 🔴 403 (C) |
| **B**    | `abc-B.json`    | A ➔ B (read + delegate) ➔ C may read X.                                   | 🟢 200     |
| **C**    | `abc-C.json`    | A allows B to transform X using protocol *x-to-y*. Readers: A and B only. | 🔴 403     |
| **D**    | `abc-D.json`    | A allows B to transform X using protocol *x-to-z*. Reader: C only.        | 🟢 200     |

## Running the demo

Build and start all services with Docker:

```sh
docker compose up --build
```

Open [http://localhost:4500](http://localhost:4500) and trigger the scenarios.
