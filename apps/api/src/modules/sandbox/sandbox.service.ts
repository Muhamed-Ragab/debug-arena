import { Injectable } from "@nestjs/common";

@Injectable()
export class SandboxService {
  /**
   * Runs a proposed fix against a challenge's hidden tests inside an
   * isolated, ephemeral Docker container: no network access, strict
   * CPU/memory/time limits. See architecture.md §2.6 — this is the
   * highest-risk component and needs the most scrutiny before launch.
   */
  async runFixAgainstHiddenTests(_input: {
    challengeId: string;
    proposedFix: unknown;
  }): Promise<{ passed: boolean; output: string }> {
    throw new Error("Not implemented");
  }
}
