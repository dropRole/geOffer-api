import { SetMetadata } from '@nestjs/common';
import UserPrivilege from './types/user-privilege';

const IsPrivileged = 'IsPrivileged';

const PrivilegedRoute = (...privileges: UserPrivilege[]) =>
  SetMetadata(IsPrivileged, privileges);

export { IsPrivileged, PrivilegedRoute };
