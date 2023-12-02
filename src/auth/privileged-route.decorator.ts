import { SetMetadata } from '@nestjs/common';

const IsPrivileged = 'IsPublic';

const PrivilegedRoute = () => SetMetadata(IsPrivileged, true);

export { IsPrivileged, PrivilegedRoute };
