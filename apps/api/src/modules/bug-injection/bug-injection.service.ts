import { Injectable } from "@nestjs/common";

@Injectable()
export class BugInjectionService {
  /**
   * Phase 2 feature (see plan.md). Takes a reference repo + requested
   * category/difficulty, asks an LLM agent to inject a realistic bug,
   * verifies it reproduces via the sandbox runner, then persists a new
   * draft challenge for admin review.
   */
  async injectBug(_input: {
    sourceRepoUrl: string;
    categoryId: string;
    difficulty: "easy" | "medium" | "hard";
  }) {
    throw new Error("Not implemented — Phase 2");
  }
}
