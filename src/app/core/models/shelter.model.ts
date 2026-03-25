export interface ShelterRequest {
  account: {
    email: string;
    password: string;
    username: string;
  };
  name: string;
  description: string;
  location: string;
  phone: string;
  address: string;
}

export interface ShelterResponse {
  idShelter: number;
  name: string;
  description?: string;
  location?: string;
  phone?: string;
  address?: string;
  verified?: boolean;
  accountId?: number;
  email?: string;
  username?: string;
  profilePhoto?: string;
  account?: {
    idAccount?: number;
    email?: string;
    username?: string;
    profilePhoto?: string;
    role?: string;
    creationDate?: string | Date;
  };
}
