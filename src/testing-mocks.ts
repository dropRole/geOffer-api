import User from './auth/user.entity';
import Offeree from './offerees/offeree.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Request from './requests/request.entity';
import Offeror from './offerors/offeror.entity';
import Reservation from './reservations/reservation.entity';
import Incident from './incidents/incident.entity';
import Complaint from './complaints/complaint.entity';
import Prohibition from './prohibitions/prohibition.entity';

const JWTSecret = 'G2DEKyvZ49YLLgi7r/MGEC17W+pEFqdEeOlcouS8lvw=';

let mockUsersRepo: User[] = [];
let mockOffereesRepo: Offeree[] = [];
let mockOfferorsRepo: Offeror[] = [];
let mockRequestsRepo: Request[] = [];
let mockReservationsRepo: Reservation[] = [];
let mockIncidentsRepo: Incident[] = [];
let mockComplaintsRepo: Complaint[] = [];
let mockProhibitionsRepo: Prohibition[] = [];

mockUsersRepo = [
  {
    username: 'gustavofring',
    privilege: 'SUPERUSER',
    password: bcrypt.hashSync('gusFring@58', 9),
    created: new Date().toLocaleString(),
    incidents: [],
    complaints: [],
  },
  {
    username: 'mikeehrmantraut',
    privilege: 'OFFEREE',
    password: bcrypt.hashSync('oldMike@43', 9),
    created: new Date().toLocaleString(),
    incidents: [mockIncidentsRepo[0]],
    complaints: [mockComplaintsRepo[0]],
  },
  {
    username: 'lalosalamanca',
    privilege: 'OFFEREE',
    password: bcrypt.hashSync('lalosalamanca@60', 9),
    created: new Date().toLocaleString(),
    incidents: [mockIncidentsRepo[1]],
    complaints: [mockComplaintsRepo[1]],
  },
  {
    username: 'lospolloshermanos',
    privilege: 'OFFEROR',
    password: bcrypt.hashSync('losPOLLOShermanos@17', 9),
    created: new Date().toLocaleString(),
    incidents: [],
    complaints: [],
  },
  {
    username: 'elmichoacano',
    privilege: 'OFFEROR',
    password: bcrypt.hashSync('elMichoacano@86', 9),
    created: new Date().toLocaleString(),
    incidents: [],
    complaints: [],
  },
];

mockOffereesRepo = [
  {
    id: uuidv4(),
    name: 'Mike',
    surname: 'Ehrmantraut',
    email: 'mikeehrmantraut@email.com',
    user: mockUsersRepo[1],
    requests: [mockRequestsRepo[0]],
  },
  {
    id: uuidv4(),
    name: 'Lalo',
    surname: 'Salamanca',
    email: 'lalosalamanca@email.com',
    user: mockUsersRepo[2],
    requests: [mockRequestsRepo[2]],
  },
];

mockOfferorsRepo = [
  {
    id: uuidv4(),
    name: 'Los Pollos Hermanos',
    address: {
      street: {
        name: 'Coors Rd SW',
        numeration: '12000 - 12100',
      },
      city: {
        name: 'Albuquerque',
        postalCode: '87101',
      },
      country: 'New Mexico',
    },
    telephone: '(505) 146-0195',
    email: 'lospolloshermanos@email.com',
    businessHours:
      '7am - 10pm Monday - Thursday; 7am - 12am Friday - Saturday (drive-thru open until 1am Friday); 7am - 9pm Sunday',
    reputation: { responsiveness: 10, compliance: 10, timeliness: 10 },
    user: mockUsersRepo[2],
    requests: [mockRequestsRepo[0]],
  },
  {
    id: uuidv4(),
    name: 'El Michoacáno',
    address: {
      street: {
        name: 'El Moreno, Isleta Blvd SW',
        numeration: '2511',
      },
      city: {
        name: 'Albuquerque',
        postalCode: '87101',
      },
      country: 'New Mexico',
    },
    telephone: '(505) 0195-146',
    email: 'elmichoacano@email.com',
    businessHours:
      '7am - 10pm Monday - Thursday; 7am - 12am Friday - Saturday; 7am - 9pm Sunday',
    reputation: { responsiveness: 10, compliance: 10, timeliness: 10 },
    user: mockUsersRepo[4],
    requests: [mockRequestsRepo[1]],
  },
];

mockRequestsRepo = [
  {
    id: uuidv4(),
    seats: 2,
    cause: 'Randevouz',
    note: 'Table for two',
    requestedAt: new Date().toString(),
    requestedFor: new Date(
      new Date().setHours(new Date().getHours() + 3),
    ).toString(),
    assessment: undefined,
    offeree: mockOffereesRepo[0],
    offeror: mockOfferorsRepo[0],
  },
  {
    id: uuidv4(),
    seats: 5,
    cause: 'Familia gathering',
    note: undefined,
    requestedAt: new Date().toString(),
    requestedFor: new Date(
      new Date().setHours(new Date().getHours() + 0.5),
    ).toString(),
    assessment: new Date(
      new Date().setHours(new Date().getHours() + 3.5),
    ).toString(),
    offeree: mockOffereesRepo[1],
    offeror: mockOfferorsRepo[1],
  },
];

mockReservationsRepo = [
  {
    id: uuidv4(),
    code: uuidv4().substring(0, 15),
    reserved: new Date().toString(),
    request: mockRequestsRepo[0],
    incidents: [mockIncidentsRepo[0]],
  },
  {
    id: uuidv4(),
    code: uuidv4().substring(0, 15),
    reserved: new Date().toString(),
    request: mockRequestsRepo[1],
    incidents: [mockIncidentsRepo[1]],
  },
];

mockIncidentsRepo = [
  {
    id: uuidv4(),
    title: "I'm too old for this.",
    status: 'REJECTED',
    opened: new Date().toString(),
    openedBy: mockUsersRepo[1],
    conclusion: '',
    reservation: mockReservationsRepo[0],
    complaints: [mockComplaintsRepo[0], mockComplaintsRepo[1]],
  },
  {
    id: uuidv4(),
    title: 'Familia is utterly loud.',
    status: 'RESOLVED',
    opened: new Date().toString(),
    openedBy: mockUsersRepo[4],
    conclusion: 'True as hell.',
    reservation: mockReservationsRepo[1],
    complaints: [],
  },
];

mockComplaintsRepo = [
  {
    id: uuidv4(),
    content: 'Too fansy for old Mikey.',
    author: mockUsersRepo[1],
    written: new Date().toString(),
    edited: undefined,
    counteredComplaint: undefined,
    incident: mockIncidentsRepo[0],
  },
];

mockComplaintsRepo.push({
  id: uuidv4(),
  content: 'Say it to your boss.',
  author: mockUsersRepo[2],
  written: new Date().toString(),
  edited: undefined,
  counteredComplaint: mockComplaintsRepo[0],
  incident: mockIncidentsRepo[0],
});

mockComplaintsRepo.push({
  id: uuidv4(),
  content: 'Cannot withstand the loudness.',
  author: mockUsersRepo[4],
  written: new Date().toString(),
  edited: undefined,
  counteredComplaint: undefined,
  incident: mockIncidentsRepo[1],
});

mockProhibitionsRepo = [
  {
    id: uuidv4(),
    beginning: new Date().toString(),
    termination: new Date(
      new Date().setDate(new Date().getDate() + 1),
    ).toString(),
    incident: mockIncidentsRepo[0],
  },
  {
    id: uuidv4(),
    beginning: new Date().toString(),
    termination: new Date(
      new Date().setDate(new Date().getDate() + 3),
    ).toString(),
    incident: mockIncidentsRepo[1],
  },
];

export { JWTSecret, mockUsersRepo, mockOffereesRepo };
