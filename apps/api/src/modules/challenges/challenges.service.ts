import { Injectable } from "@nestjs/common";

@Injectable()
export class ChallengesService {
  async list(filters: { category?: string; difficulty?: string }) {
    // TODO: query @debug-arena/db challenges table, filter by category/difficulty, status = published
    return [];
  }

  async detail(id: string) {
    // TODO: fetch challenge + hints by id
    return null;
  }
}
