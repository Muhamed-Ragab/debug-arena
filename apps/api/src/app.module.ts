import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { ChallengesModule } from "./modules/challenges/challenges.module";
import { SubmissionsModule } from "./modules/submissions/submissions.module";
import { GradingModule } from "./modules/grading/grading.module";
import { BugInjectionModule } from "./modules/bug-injection/bug-injection.module";
import { SandboxModule } from "./modules/sandbox/sandbox.module";

@Module({
  imports: [
    AuthModule,
    ChallengesModule,
    SubmissionsModule,
    GradingModule,
    BugInjectionModule,
    SandboxModule,
  ],
})
export class AppModule {}
