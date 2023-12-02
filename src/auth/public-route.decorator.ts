import { SetMetadata } from '@nestjs/common';

const IsPublic = 'IsPublic';

const PublicRoute = () => SetMetadata(IsPublic, true);

export { IsPublic, PublicRoute };
