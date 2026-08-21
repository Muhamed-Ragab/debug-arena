import { Module } from "@nestjs/common";
import { GradingService } from "./grading.service";

@Module({
  providers: [GradingService],
  exports: [GradingService],
})
export class GradingModule {}
