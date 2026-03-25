export type HealthAnimalStatus =
  | 'HEALTHY'
  | 'MINOR_INJURY'
  | 'INJURED'
  | 'SERIOUSLY_INJURED'
  | 'SICK'
  | 'MALNOURISHED'
  | 'ABUSED'
  | 'DEAD'
  | 'UNKNOWN'
  | string;
export type ReportStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CLOSED'
  | string;

export interface ReportStatusUpdateRequest {
  newStatus: ReportStatus;
  accountId?: number;
  shelterId?: number;
}

export interface ReportRequest {
  userId: number;
  location: string;
  photos: string[];
  healthStatus: HealthAnimalStatus;
  description: string;
}

export interface ReportResponse {
  idReport?: number;
  id?: number;
  location: string;
  photos: string[];
  healthStatus: HealthAnimalStatus;
  description: string;
  reportedAt: string | Date;
  reportStatus: ReportStatus;
  userId: number;
  userFirstName?: string;
  userLastName?: string;
}
