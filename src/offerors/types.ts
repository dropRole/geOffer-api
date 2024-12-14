type OfferorAddress = {
  street: {
    name: string;
    numeration: string;
  };
  city: {
    name: string;
    postalCode: string;
  };
  country?: string;
};

type OfferorCoordinates = {
  latitude: number;
  longitude: number;
};

type OfferorService = {
  category: 'Restaurant' | 'Café/Pub' | 'Movie Theater';
  service: {
    name: 'Dinning' | 'Drinking' | 'Ticket selling';
    description: string;
  };
};

type OfferorBusinessHours = {
  [key in
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday']: { from: string; to: string };
};

type OfferorReputation = {
  responsiveness: number;
  compliance: number;
  timeliness: number;
};

type OfferorImageType = 'HIGHLIGHT' | 'GALLERY';

export {
  OfferorAddress,
  OfferorCoordinates,
  OfferorService,
  OfferorBusinessHours,
  OfferorReputation,
  OfferorImageType,
};
