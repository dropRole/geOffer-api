import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IsPrivileged } from './privileged-route.decorator';
import { UserPrivilege } from './types';

@Injectable()
export class PrivilegeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext) {
    const privileges: UserPrivilege[] = this.reflector.getAllAndOverride<
      UserPrivilege[]
    >(IsPrivileged, [ctx.getHandler()]);

    if (!privileges || privileges.length === 0) return true;

    const { user } = ctx.switchToHttp().getRequest();

    return privileges.some((privilege) => privilege === user.privilege);
  }
}
