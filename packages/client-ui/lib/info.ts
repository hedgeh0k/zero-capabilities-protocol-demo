export const TASK_DESCRIPTION = `Question 2: We want to enable sharing data between stakeholders with (1) access right delegation and (2) no centralized service. One way to do this is to set up a hardware protected environment (which I think wont work) or by a legal framework. Suppose all stakeholders agree to use the same code-base to generate policy-bearing tokens, specifically using ZCAPS.

The readable stuff:
https://kyledenhartog.com/comparing-VCs-with-zcaps/

The unreadable stuff:
https://decentralized-id.com/development/object-capabilities/
https://w3c-ccg.github.io/zcap-spec/

Suppose we have 2 companies: a.example.com and b.example.com and some user c which enter the legal agreement. Companies a and b host services a.example.com/zcaps?user which returns all valid ZCAPS company “a” issues the user (a, b or c). A,B,C have private and public keys.

Companies a hosts datasets under a.example.com/aXXXXX where a indicates that the dataset is from a and XXXX is the name of the dataset. B does the same under b.example.com. For example

a.example.com/ab is a dataset from a which only b should be allowed to read.
a.example.com/ac is a dataset from a which on c can read.

For a user to get access the user first queries the zcap endpoint of the provider to obtain all possible zcaps (we can make this more clever later) and then queries the dataset endpoint with the appropriate zcap.

2.1 Provide a zcap generator that can issue ZCAP that express the following type of legal agreements:

 a A owns dataset x and Y can read it.
 b A owns dataset x and allow Y to delegate access rights to x to Z.
 c A owns dataset x and allows Y to Y processes this dataset using protocol (x-to-y) to generate dataset y then A and Y can read it, but not C.
 d A owns dataset x and allows Y to process this dataset using protocol (x-to-z) to generate dataset z and then C can read it but no one else.


For points c & d assume that Y is honest about which protocol he used to process the data (I.e. not violating the agreement)

2.2. write some simple server which tests this for a few use-cases.`;

export const SOLUTION_DESCRIPTION = `\
This monorepo is orchestrated by docker-compose and starts four services:

• issuer - runs once, generates ZCAP tokens and example keys, writes them to the shared \`caps\` volume, then exits. The generated files are displayed verbatim in the UI.

• party A dataset-server - uses universal micro-service code (port - 4100) that serves A’s raw and derived datasets under the virtual domain a.example.com and enforces every capability caveat. Verifies signatures for incoming requests.

• party B dataset-server - identical service from the same microservice code (port - 4200) running under b.example.com.

• client-ui - Next.js + Tailwind + Daisy-UI front-end (host :4500 → container :8080) that demonstrates the four capability scenarios. Every request sent from this UI is signed as “User C” .

Why we have a GUI
─────────────────
The interface puts all demo artefacts in one place:

• Keys & capabilities from the issuer (side panel).
• Four one-click scenario buttons that load the matching capability, attach the correct headers, sign and hit the target dataset endpoint.
• A full request/response dump.

How to test:
Click a scenario button - the UI does everything for you.


`;
