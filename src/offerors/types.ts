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

type OfferorServiceCategory = 'Restaurant' | 'Café/Pub' | 'Movie Theater';

type OfferorServiceSubcategory = 'Dinning' | 'Drink order' | 'Ticket selling';

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
  OfferorServiceCategory,
  OfferorServiceSubcategory,
  OfferorBusinessHours,
  OfferorReputation,
  OfferorImageType,
};
