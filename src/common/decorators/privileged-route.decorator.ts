import { SetMetadata } from '@nestjs/common';
import UserPrivilege from '../../auth/entities/user.entity';

const IsPrivileged = 'IsPrivileged';

const PrivilegedRoute = (...privileges: UserPrivilege[]) =>
  SetMetadata(IsPrivileged, privileges);

export { IsPrivileged, PrivilegedRoute };
