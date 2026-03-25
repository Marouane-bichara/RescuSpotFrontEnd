export type AnimalSpecies = string;
export type AnimalBreed = string;
export type AnimalGender = string;

export const ANIMAL_SPECIES_OPTIONS: AnimalSpecies[] = [
  'DOG',
  'CAT',
  'BIRD',
  'RABBIT',
  'HAMSTER',
  'TURTLE',
  'FISH',
  'OTHER'
];

export const ANIMAL_GENDER_OPTIONS: AnimalGender[] = [
  'MALE',
  'FEMALE',
  'UNKNOWN'
];

export const ANIMAL_BREED_OPTIONS: AnimalBreed[] = [
  'GERMAN_SHEPHERD',
  'LABRADOR',
  'GOLDEN_RETRIEVER',
  'BULLDOG',
  'POODLE',
  'HUSKY',
  'PERSIAN',
  'SIAMESE',
  'MAINE_COON',
  'SPHYNX',
  'BENGAL',
  'HOLLAND_LOP',
  'NETHERLAND_DWARF',
  'MIXED',
  'UNKNOWN'
];

export interface AnimalRequest {
  name: string;
  species: AnimalSpecies;
  breed: AnimalBreed;
  gender: AnimalGender;
  age: number;
  description: string;
  picture: string;
  shelterId: number;
}

export interface AnimalShelterInfo {
  idShelter: number;
  name: string;
  description?: string;
  location?: string;
  phone?: string;
  address?: string;
  email?: string;
  username?: string;
  profilePhoto?: string;
  verified?: boolean;
  account?: {
    profilePhoto?: string;
  };
}

export interface AnimalAdoptionInfo {
  idAdoption?: number;
  status?: string;
  requestDate?: string | Date;
}

export interface AnimalResponse {
  idAnimal: number;
  name: string;
  species: AnimalSpecies;
  breed: AnimalBreed;
  gender: AnimalGender;
  age: number;
  description: string;
  picture?: string;
  shelter: AnimalShelterInfo;
  adoptions?: AnimalAdoptionInfo[];
}
