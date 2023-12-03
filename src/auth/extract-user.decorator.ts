import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const ExtractUser = createParamDecorator((_data, ctx: ExecutionContext) => {
  const { user } = ctx.switchToHttp().getRequest();

  return user;
});

export default ExtractUser;
