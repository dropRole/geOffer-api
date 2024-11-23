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

type OfferorReputation = {
  responsiveness: number;
  compliance: number;
  timeliness: number;
};

export { OfferorAddress, OfferorReputation };
