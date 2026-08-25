import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { BetterAuthSessionGuard } from "../../common/guards/better-auth-session.guard";
import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";

@Controller("users")
export class UsersController {
  @Get("me")
  @UseGuards(BetterAuthSessionGuard)
  me(@Req() req: AuthenticatedRequest) {
    // ResponseInterceptor wraps this into { success, data, error }
    return req.user;
  }
}
