/** --------------------------------------------------------------
 * A very small wrapper for creating object capabilities (ZCAPs).
 *
 * The real EZCAP library from Digital Bazaar performs complex
 * operations such as linked data proof generation and signature
 * verification.  For the purposes of this demo we implement only
 * the minimal pieces required to express delegation chains.  Each
 * capability is a plain JSON object with a unique identifier, a
 * reference to its parent capability (if any), and the resource it
 * targets.  Caveats may restrict how a capability may be used.
 * -------------------------------------------------------------- */
import { randomUUID } from 'crypto';
import type { PartyKeys } from './key-utils.js';

/**
 * The shape of a capability as produced by this helper.  It is a
 * simplified subset of the ZCAP specification tailored for this
 * exercise.  In production systems you would include proof
 * structures and conform to the linked data vocabulary.
 */
export interface Capability {
  /** A unique URN identifying this capability. */
  id: string;
  /** The parent capability from which this one was delegated. */
  parent?: string;
  /** The DID of the actor who issued (delegated) this capability. */
  invoker: string;
  /** The DID of the actor who controls this capability. */
  controller: string;
  /** The URI of the resource that this capability grants access to. */
  invocationTarget: string;
  /** The actions permitted by this capability, e.g. read or transform. */
  allowedActions: string[];
  /** Optional caveats restricting how or by whom the capability may be used. */
  caveats?: {
    /** Only a specific protocol may be used when transforming data. */
    protocol?: string;
    /** A list of parties allowed to read the output of a transform. */
    readers?: string[];
  };
}

/**
 * Construct a simple ZCAP client for a given actor.  The returned
 * helper exposes a delegate method which takes a parent capability
 * and produces a child capability delegating a subset of the parent
 * rights to another controller.  The invoker field is populated
 * automatically with the caller’s DID.
 *
 * @param keys the key material and DID for the actor performing the delegation
 */
export function zcapClient(keys: PartyKeys) {
  return {
    /**
     * Delegate a capability.  You must supply the parent capability
     * information (id, controller, invocationTarget, allowedActions) and
     * specify the delegate’s DID as the controller.  The set of
     * allowedActions must be a subset of the parent allowed actions in
     * a real system; for this demo no enforcement is performed here.
     */
    delegate({
      capability,
      controller,
      allowedActions,
      caveats,
    }: {
      capability: {
        id: string;
        controller: string;
        invocationTarget: string;
        allowedActions: string[];
      };
      controller: string;
      allowedActions: string[];
      caveats?: Capability['caveats'];
    }): Capability {
      const id = `urn:uuid:${randomUUID()}`;
      return {
        id,
        parent: capability.id,
        invoker: keys.did,
        controller,
        invocationTarget: capability.invocationTarget,
        allowedActions,
        caveats,
      };
    },
  };
}