import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IsPublic } from '../decorators/public-route.decorator';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(ctx: ExecutionContext) {
    const isPublicRoute: boolean = this.reflector.getAllAndOverride<boolean>(
      IsPublic,
      [ctx.getHandler()],
    );

    if (isPublicRoute) return true;

    return super.canActivate(ctx);
  }
}
