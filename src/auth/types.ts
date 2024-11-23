type UserPrivilege = 'SUPERUSER' | 'OFFEREE' | 'OFFEROR';

type JwtPayload = {
  username: string;
};

export { UserPrivilege, JwtPayload };
