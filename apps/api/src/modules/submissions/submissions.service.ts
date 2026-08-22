import { Injectable } from "@nestjs/common";

@Injectable()
export class SubmissionsService {
  async submit(_input: unknown) {
    // TODO orchestration (see architecture.md §3):
    // 1. run proposed fix in sandbox against hidden tests
    // 2. enqueue grading job (embedding + LLM judge) for root-cause explanation
    // 3. compute composite score once grading resolves
    // 4. persist submission, update user_category_stats
    throw new Error("Not implemented");
  }
}
