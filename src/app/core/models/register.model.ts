export interface AccountRequest {
  email: string;
  password: string;
  username: string;
}

export interface UserRegisterRequest {
  account: AccountRequest;
  firstName: string;
  lastName: string;
}

export interface ShelterRegisterRequest {
  account: AccountRequest;
  name: string;
  description: string;
  location: string;
  phone: string;
  address: string;
}
