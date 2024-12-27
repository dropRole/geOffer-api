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

type OfferorCategory = 'Restaurant' | 'Café/Pub' | 'Movie Theater';

type OfferorServiceCategory = 'Seat reservation' | 'Ticket selling';

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
  OfferorCategory,
  OfferorServiceCategory,
  OfferorBusinessHours,
  OfferorReputation,
  OfferorImageType,
};
