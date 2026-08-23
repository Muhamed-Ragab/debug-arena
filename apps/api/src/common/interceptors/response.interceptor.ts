import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(map((data: T) => ({ success: true, data })));
  }
}
