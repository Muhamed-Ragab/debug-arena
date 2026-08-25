import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./common/auth/auth";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { ChallengesModule } from "./modules/challenges/challenges.module";
import { SubmissionsModule } from "./modules/submissions/submissions.module";
import { GradingModule } from "./modules/grading/grading.module";
import { BugInjectionModule } from "./modules/bug-injection/bug-injection.module";
import { SandboxModule } from "./modules/sandbox/sandbox.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: "2mb" },
        urlencoded: { limit: "2mb", extended: true },
        rawBody: true,
      },
    }),
    ChallengesModule,
    SubmissionsModule,
    GradingModule,
    BugInjectionModule,
    SandboxModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
