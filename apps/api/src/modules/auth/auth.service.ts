import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {
  async register(input: { email: string; username: string; password: string }) {
    // TODO: hash password, insert user via @debug-arena/db, issue JWT
    throw new Error("Not implemented");
  }

  async login(input: { email: string; password: string }) {
    // TODO: verify credentials, issue JWT
    throw new Error("Not implemented");
  }
}
