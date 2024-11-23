type UserPrivilege = 'SUPERUSER' | 'OFFEREE' | 'OFFEROR';

type JwtPayload = {
  username: string;
};

type Token = {
  type: 'access' | 'refresh';
  value: string;
  expire: string;
};

export { UserPrivilege, JwtPayload, Token };
