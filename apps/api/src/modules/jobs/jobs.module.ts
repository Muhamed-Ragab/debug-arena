import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

// Registers BullMQ queues used across the app: grading jobs, sandbox test
// runs, and bug-injection jobs (see architecture.md §2.4).
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
    }),
    BullModule.registerQueue(
      { name: "grading" },
      { name: "sandbox-run" },
      { name: "bug-injection" },
    ),
  ],
  exports: [BullModule],
})
export class JobsModule {}
