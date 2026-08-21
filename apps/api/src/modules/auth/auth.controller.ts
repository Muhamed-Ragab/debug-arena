import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";

// TODO: wire to @ts-rest/nest contract handler (authContract) instead of
// plain Nest decorators once the contract implementation pattern is settled.
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() body: { email: string; username: string; password: string }) {
    return this.authService.register(body);
  }

  @Post("login")
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }
}
