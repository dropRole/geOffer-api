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

type OfferorReputation = {
  responsiveness: number;
  compliance: number;
  timeliness: number;
};

type OfferorImageType = 'HIGHLIGHT' | 'GALLERY';

export {
  OfferorAddress,
  OfferorCoordinates,
  OfferorReputation,
  OfferorImageType,
};
