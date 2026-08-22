import { Injectable } from "@nestjs/common";

@Injectable()
export class GradingService {
  /**
   * Scores a user's free-text root-cause explanation against a challenge's
   * canonical root-cause summary.
   *
   * Two-step approach (see architecture.md §2.5):
   * 1. Cheap pass — pgvector cosine similarity between the submission's
   *    embedding and challenges.root_cause_embedding.
   * 2. Full LLM judge reasoning call for borderline/low-confidence cases,
   *    via the Vercel AI SDK.
   */
  async gradeExplanation(_input: {
    challengeId: string;
    explanation: string;
  }): Promise<{ score: number; feedback: string }> {
    // TODO: compute embedding, run pgvector similarity query, call AI SDK for judge score
    throw new Error("Not implemented");
  }
}
