export interface FleetUnit {
  id: string;
  public_id: string;
  price: number;
  modelName: string;
  image: string;
  status: string;
}

export interface TripDetails {
  startDate: string;
  endDate: string;
  pickupType: 'hub' | 'delivery';
  deliveryAddress: string;
  distanceKm: number;
  location: string;
}

export interface KycData {
  fullName: string;
  phone: string;
  email: string;
  idNumber: string;
  idFront: File | null;
  idBack: File | null;
  dlFront: File | null;
  livenessVideo: Blob | null;
}

export interface ContractData {
  signatureBlob: Blob | null;
}

export interface PaymentDetails {
  method: 'mpesa' | 'card';
  mpesaCode: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}