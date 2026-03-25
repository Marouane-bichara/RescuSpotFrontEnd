export interface UserRequest {
  account: {
    email: string;
    password: string;
    username: string;
  };
  firstName: string;
  lastName: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  location?: string;
}

export interface UserResponse {
  idUser: number;
  accountId?: number;
  firstName?: string;
  lastName?: string;
  bio?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  location?: string;
  account?: {
    idAccount?: number;
    email?: string;
    username?: string;
    profilePhoto?: string;
    role?: string;
    creationDate?: string | Date;
  };
}
