import { Component, EventEmitter, Input, Output } from '@angular/core';

interface ShelterAdoptionRequestItem {
  idAdoption: number | null;
  animalId: number;
  animalName: string;
  requesterName: string;
  requesterAccountId: number | null;
  requesterPhoto: string;
  status: string;
  requestDate: string;
}

@Component({
  selector: 'app-shelter-requests-page',
  standalone: true,
  templateUrl: './requests-page.component.html'
})
export class ShelterRequestsPageComponent {
  @Input() pendingCount = 0;
  @Input() approvedCount = 0;
  @Input() rejectedCount = 0;
  @Input() requests: ShelterAdoptionRequestItem[] = [];
  @Input() reviewingAdoptionId: number | null = null;
  @Input() localImageServerUrl = 'http://localhost:8090';

  @Output() approve = new EventEmitter<number>();
  @Output() reject = new EventEmitter<number>();
  @Output() messageUser = new EventEmitter<number>();

  isPending(status: string): boolean {
    return (status || '').toUpperCase() === 'PENDING';
  }

  getRequesterPhoto(request: ShelterAdoptionRequestItem): string {
    const rawPath = (request.requesterPhoto || '').trim();

    if (!rawPath) {
      return 'https://placehold.co/96x96/0f172a/cbd5e1?text=U';
    }

    if (rawPath.startsWith('http') || rawPath.startsWith('data:')) {
      return rawPath;
    }

    if (rawPath.startsWith('/')) {
      return `${this.localImageServerUrl}${rawPath}`;
    }

    return `${this.localImageServerUrl}/${rawPath}`;
  }
}
