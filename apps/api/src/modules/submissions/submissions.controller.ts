import { Body, Controller, Post } from "@nestjs/common";
import { SubmissionsService } from "./submissions.service";

@Controller("submissions")
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  submit(@Body() body: unknown) {
    // TODO: validate body against SubmitAttemptSchema from @debug-arena/contracts
    return this.submissionsService.submit(body);
  }
}
