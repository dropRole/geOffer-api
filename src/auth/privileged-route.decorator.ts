import { SetMetadata } from '@nestjs/common';
import { UserPrivilege } from './types';

const IsPrivileged = 'IsPrivileged';

const PrivilegedRoute = (...privileges: UserPrivilege[]) =>
  SetMetadata(IsPrivileged, privileges);

export { IsPrivileged, PrivilegedRoute };
