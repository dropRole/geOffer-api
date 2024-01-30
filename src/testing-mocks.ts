import User from './auth/user.entity';
import Offeree from './offerees/offeree.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const JWTSecret = 'G2DEKyvZ49YLLgi7r/MGEC17W+pEFqdEeOlcouS8lvw=';

const mockUsersRepo: User[] = [
  {
    username: 'johndoe',
    privilege: 'SUPERUSER',
    password: bcrypt.hashSync('johnDoe@23', 9),
    created: new Date().toLocaleString(),
    incidents: [],
    complaints: [],
  },
  {
    username: 'janedoe',
    privilege: 'OFFEREE',
    password: bcrypt.hashSync('janeDoe@23', 9),
    created: new Date().toLocaleString(),
    incidents: [],
    complaints: [],
  },
];

const mockOffereesRepo: Offeree[] = [
  {
    id: uuidv4(),
    name: 'Jane',
    surname: 'Doe',
    email: 'janedoe@email.com',
    user: mockUsersRepo[1],
    requests: [],
  },
];

export { JWTSecret, mockUsersRepo, mockOffereesRepo };
