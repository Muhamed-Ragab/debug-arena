import { Controller, Get, Param, Query } from "@nestjs/common";
import { ChallengesService } from "./challenges.service";

@Controller("challenges")
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  list(@Query("category") category?: string, @Query("difficulty") difficulty?: string) {
    return this.challengesService.list({ category, difficulty });
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.challengesService.detail(id);
  }
}
