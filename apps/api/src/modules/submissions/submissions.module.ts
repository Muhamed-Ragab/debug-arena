import { Module } from "@nestjs/common";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";
import { GradingModule } from "../grading/grading.module";
import { SandboxModule } from "../sandbox/sandbox.module";

@Module({
  imports: [GradingModule, SandboxModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}
