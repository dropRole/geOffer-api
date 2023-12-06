import { Address, AddressNormalized } from './reversed-location';

type SearchedLocation = {
  place_id: string;
  licence: string;
  osm_type?: string;
  osm_id?: string;
  lat: string;
  lon: string;
  display_name: string;
  class?: string;
  type?: string;
  importance?: number;
  address?: Address | AddressNormalized;
  boundingbox: string[];
  namedetails?: { name: string };
  extratags?: Record<any, any>;
  geojson?: { type: string; coordinates: number[] };
  geokml?: string;
  svg?: string;
  geotext?: string;
  icon?: string;
  matchquality?: { matchcode: string; matchtype: string; matchlevel: string };
  postaladdress?: string;
};

export default SearchedLocation;
