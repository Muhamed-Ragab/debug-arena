import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    res.on("finish", () => {
      const delay = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${delay}ms`);
    });
    next();
  }
}
