import { Injectable } from "@nestjs/common";

@Injectable()
export class ChallengesService {
  async list(_filters: { category?: string; difficulty?: string }) {
    // TODO: query @debug-arena/db challenges table, filter by category/difficulty, status = published
    return [];
  }

  async detail(_id: string) {
    // TODO: fetch challenge + hints by id
    return null;
  }
}
