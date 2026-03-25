export type AdoptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string;

export interface AdoptionRequest {
  animalId: number;
  userId: number;
  shelterId: number;
  requestDate: string | Date;
}

export interface AdoptionDecision {
  status: AdoptionStatus;
}

export interface AdoptionResponse {
  idAdoption: number;
  requestDate: string | Date;
  status: AdoptionStatus;
  animal?: {
    idAnimal?: number;
    name?: string;
  };
  user?: {
    idUser?: number;
    firstName?: string;
    lastName?: string;
    account?: {
      idAccount?: number;
      email?: string;
      username?: string;
      profilePhoto?: string;
    };
  };
  shelter?: {
    idShelter?: number;
    name?: string;
  };
}
