import { User } from './auth/entities/user.entity';
import Offeree from './offerees/entities/offeree.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Request from './requests/entities/request.entity';
import { Offeror } from './offerors/entities/offeror.entity';
import Reservation from './reservations/entities/reservation.entity';
import { Incident } from './incidents/entities/incident.entity';
import Complaint from './complaints/entities/complaint.entity';
import Prohibition from './prohibitions/entities/prohibition.entity';
import { ReversedLocation, SearchedLocation } from './locationiq/types';
import OfferorImage from './offerors/entities/image.entity';

const JWTSecret = 'G2DEKyvZ49YLLgi7r/MGEC17W+pEFqdEeOlcouS8lvw=';

let mockUsersRepo: User[] = [];
let mockOffereesRepo: Offeree[] = [];
let mockOfferorsRepo: Offeror[] = [];
let mockOfferorImagesRepo: OfferorImage[] = [];
let mockRequestsRepo: Request[] = [];
let mockReservationsRepo: Reservation[] = [];
let mockIncidentsRepo: Incident[] = [];
let mockComplaintsRepo: Complaint[] = [];
let mockProhibitionsRepo: Prohibition[] = [];
let reverseGeocodingAPIResponse: ReversedLocation = {
  place_id: '295877384',
  licence: 'https://locationiq.com/attribution',
  osm_type: 'way',
  osm_id: '940433091',
  lat: '43.88325365',
  lon: '20.34742655',
  display_name:
    '21, Kneza Vasa Popovica, MZ 3. decembar, Cacak, Čačak, City of Čačak, Moravica Administrative District, Central Serbia, 32000, Serbia',
  address: {
    house_number: '21',
    road: 'Kneza Vasa Popovica',
    suburb: 'MZ 3. decembar',
    city_district: 'Cacak',
    city: 'Čačak',
    county: 'Moravica Administrative District',
    state: 'Central Serbia',
    postcode: '32000',
    country: 'Serbia',
    country_code: 'rs',
  },
  boundingbox: ['43.8831878', '43.8833195', '20.3473323', '20.3475208'],
};
let forwardGeocodingAPIResponse: SearchedLocation = {
  place_id: '331489194615',
  licence: 'https://locationiq.com/attribution',
  lat: '43.883239',
  lon: '20.347267',
  display_name: 'Kneza Vase Popovica, Čačak, Morava, Serbia',
  boundingbox: ['43.880705', '43.885568', '20.346109', '20.34911'],
  importance: 0.2,
};

mockUsersRepo = [
  {
    username: 'geofferadmin',
    privilege: 'SUPERUSER',
    password: bcrypt.hashSync('geoffer@Admin24', 9),
    created: new Date().toLocaleString(),
    incidents: [],
    complaints: [],
  },
  {
    username: 'johndoe',
    privilege: 'OFFEREE',
    password: bcrypt.hashSync('johnDoe@24', 9),
    created: new Date().toLocaleString(),
    incidents: [mockIncidentsRepo[0]],
    complaints: [mockComplaintsRepo[0]],
  },
  {
    username: 'janedoe',
    privilege: 'OFFEREE',
    password: bcrypt.hashSync('janeDoe@24', 9),
    created: new Date().toLocaleString(),
    incidents: [mockIncidentsRepo[1]],
    complaints: [],
  },
  {
    username: 'restoranpetrovic',
    privilege: 'OFFEROR',
    password: bcrypt.hashSync('restoranPetrovic@24', 9),
    created: new Date().toLocaleString(),
    incidents: [mockIncidentsRepo[0]],
    complaints: [mockComplaintsRepo[1]],
  },
  {
    username: 'kulturnicentarcacak',
    privilege: 'OFFEROR',
    password: bcrypt.hashSync('kulturniCentarCacak@24', 9),
    created: new Date().toLocaleString(),
    incidents: [mockIncidentsRepo[1]],
    complaints: [mockComplaintsRepo[2]],
  },
];

mockOffereesRepo = [
  {
    id: uuidv4(),
    name: 'John',
    surname: 'Doe',
    email: 'johndoe@email.com',
    user: mockUsersRepo[1],
    requests: [mockRequestsRepo[0]],
  },
  {
    id: uuidv4(),
    name: 'Jane',
    surname: 'Doe',
    email: 'janedoe@email.com',
    user: mockUsersRepo[2],
    requests: [mockRequestsRepo[1]],
  },
];

mockOfferorsRepo = [
  {
    id: uuidv4(),
    name: 'Restoran Petrović',
    category: 'Restaurant',
    address: {
      street: {
        name: 'Gučki put',
        numeration: '700bb',
      },
      city: {
        name: 'Čačak',
        postalCode: '32000',
      },
      country: 'Serbia',
    },
    coordinates: { latitude: 43.89139, longitude: 20.34972 },
    telephone: '032/55-90-333',
    email: 'restoran.petrovic2009@gmail.com',
    businessHours: {
      Monday: { from: '08:00', to: '00:00' },
      Tuesday: { from: '08:00', to: '00:00' },
      Wednesday: { from: '08:00', to: '00:00' },
      Thursday: { from: '08:00', to: '00:00' },
      Friday: { from: '08:00', to: '00:00' },
      Saturday: { from: '08:00', to: '00:00' },
      Sunday: { from: '08:00', to: '00:00' },
    },
    reputation: { responsiveness: 10, compliance: 10, timeliness: 10 },
    user: mockUsersRepo[3],
    services: [],
    images: [],
    events: [],
  },
  {
    id: uuidv4(),
    name: 'Bioskop Sutjeska',
    category: 'Movie Theater',
    address: {
      street: {
        name: 'Kralja Petra I',
        numeration: '26a',
      },
      city: {
        name: 'Čačak',
        postalCode: '32000',
      },
      country: 'Serbia',
    },
    coordinates: { latitude: 43.893319, longitude: 20.3464443 },
    telephone: '032 404 100',
    email: 'cacak@bioskopsutjeska.com',
    businessHours: {
      Monday: { from: '08:00', to: '22:00' },
      Tuesday: { from: '08:00', to: '22:00' },
      Wednesday: { from: '08:00', to: '22:00' },
      Thursday: { from: '08:00', to: '22:00' },
      Friday: { from: '08:00', to: '22:00' },
      Saturday: { from: '08:00', to: '22:00' },
      Sunday: { from: '08:00', to: '22:00' },
    },
    reputation: { responsiveness: 10, compliance: 10, timeliness: 10 },
    user: mockUsersRepo[4],
    services: [],
    images: [],
    events: [],
  },
];

mockOfferorImagesRepo = [
  {
    id: uuidv4(),
    destination: 'somewhere_on_aws_bucket',
    type: 'HIGHLIGHT',
    offeror: mockOfferorsRepo[0],
    event: undefined,
  },
  {
    id: uuidv4(),
    destination: 'somewhere_on_aws_bucket',
    type: 'GALLERY',
    offeror: mockOfferorsRepo[0],
    event: undefined,
  },
  {
    id: uuidv4(),
    destination: 'somewhere_on_aws_bucket',
    type: 'HIGHLIGHT',
    offeror: mockOfferorsRepo[1],
    event: undefined,
  },
];

mockOfferorsRepo[0].images = [
  mockOfferorImagesRepo[0],
  mockOfferorImagesRepo[1],
];

mockOfferorsRepo[1].images = [mockOfferorImagesRepo[2]];

mockRequestsRepo = [
  {
    id: uuidv4(),
    note: 'Table for two',
    requestedAt: new Date().toString(),
    requestedFor: new Date(
      new Date().setHours(new Date().getHours() + 3),
    ).toString(),
    assessment: undefined,
    offeree: mockOffereesRepo[0],
    services: [],
  },
  {
    id: uuidv4(),
    note: 'Two tickets for The Grand Budapest Hotel film',
    requestedAt: new Date().toString(),
    requestedFor: null,
    assessment: null,
    offeree: mockOffereesRepo[1],
    services: [],
  },
  {
    id: uuidv4(),
    note: 'Three tickets for The Grand Budapest Hotel film',
    requestedAt: new Date().toString(),
    requestedFor: null,
    assessment: null,
    offeree: mockOffereesRepo[0],
    services: [],
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
    title: 'Service impoliteness',
    status: 'REJECTED',
    opened: new Date().toString(),
    openedBy: mockUsersRepo[1],
    conclusion: 'The statement is unfounded.',
    reservation: mockReservationsRepo[0],
    complaints: [mockComplaintsRepo[0], mockComplaintsRepo[1]],
  },
  {
    id: uuidv4(),
    title: 'Unrealistic guest demands',
    status: 'RESOLVED',
    opened: new Date().toString(),
    openedBy: mockUsersRepo[3],
    conclusion: 'The statement is founded.',
    reservation: mockReservationsRepo[0],
    complaints: [mockComplaintsRepo[2]],
  },
  {
    id: uuidv4(),
    title: 'Made loud noise',
    status: 'PENDING',
    opened: new Date().toString(),
    openedBy: mockUsersRepo[4],
    conclusion: undefined,
    reservation: mockReservationsRepo[1],
    complaints: [],
  },
];

mockComplaintsRepo = [
  {
    id: uuidv4(),
    content: 'They serve cold dishes.',
    author: mockUsersRepo[1],
    written: new Date().toString(),
    edited: undefined,
    counteredComplaint: undefined,
    incident: mockIncidentsRepo[0],
  },
];

mockComplaintsRepo.push({
  id: uuidv4(),
  content: 'Dishes were served as they were prepared.',
  author: mockUsersRepo[3],
  written: new Date().toString(),
  edited: undefined,
  counteredComplaint: mockComplaintsRepo[0],
  incident: mockIncidentsRepo[0],
});

mockComplaintsRepo.push({
  id: uuidv4(),
  content: 'Guests demanded the dishes in half a price.',
  author: mockUsersRepo[3],
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
      new Date().setDate(new Date().getDate() + 3),
    ).toString(),
    incident: mockIncidentsRepo[1],
  },
];

export {
  JWTSecret,
  mockUsersRepo,
  mockOffereesRepo,
  mockProhibitionsRepo,
  mockRequestsRepo,
  mockOfferorsRepo,
  mockOfferorImagesRepo,
  mockReservationsRepo,
  mockIncidentsRepo,
  mockComplaintsRepo,
  reverseGeocodingAPIResponse,
  forwardGeocodingAPIResponse,
};
