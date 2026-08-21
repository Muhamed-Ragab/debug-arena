import { Module } from "@nestjs/common";
import { BugInjectionService } from "./bug-injection.service";

@Module({
  providers: [BugInjectionService],
  exports: [BugInjectionService],
})
export class BugInjectionModule {}
