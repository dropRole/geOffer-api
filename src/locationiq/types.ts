type Address = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  hamlet?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city_district?: string;
  city?: string;
  region?: string;
  county?: string;
  state_district?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
  country?: string;
  name?: string;
  water?: string;
};

type AddressNormalized = {
  name?: string;
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  island?: string;
  city?: string;
  county?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
};

type ReversedLocation = {
  place_id: string;
  licence: string;
  osm_type?: string;
  osm_id?: string;
  lat: string;
  lon: string;
  display_name: string;
  address?: Address | AddressNormalized;
  boundingbox: string[];
  distance?: number;
  namedetails?: { name: string };
  extratags?: Record<any, any>;
  geojson?: { type: string; coordinates: number[] };
  geokml?: string;
  svg?: string;
  geotext?: string;
  postaladdress?: string;
};

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

export { Address, AddressNormalized, ReversedLocation, SearchedLocation };
