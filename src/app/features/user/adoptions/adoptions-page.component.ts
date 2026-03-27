import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdoptionResponse } from '../../../core/models/adoption.model';
import { ShelterResponse } from '../../../core/models/shelter.model';

@Component({
  selector: 'app-user-adoptions-page',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './adoptions-page.component.html'
})
export class UserAdoptionsPageComponent {
  @Input() pendingCount = 0;
  @Input() approvedCount = 0;
  @Input() rejectedCount = 0;
  @Input() isLoadingAdoptions = false;
  @Input() adoptions: AdoptionResponse[] = [];
  @Input() shelters: ShelterResponse[] = [];
  @Input() localImageServerUrl = 'http://localhost:8090';

  @Output() messageShelter = new EventEmitter<AdoptionResponse>();

  openedAdoptionId: number | null = null;

  getShelterName(adoption: AdoptionResponse): string {
    return this.getShelter(adoption)?.name || adoption.shelter?.name || 'Unknown shelter';
  }

  getShelterPhoto(adoption: AdoptionResponse): string {
    const shelter = this.getShelter(adoption);
    const rawPath = (shelter?.profilePhoto || shelter?.account?.profilePhoto || '').trim();

    if (!rawPath) {
      return 'https://placehold.co/96x96/0f172a/cbd5e1?text=S';
    }

    if (rawPath.startsWith('http') || rawPath.startsWith('data:')) {
      return rawPath;
    }

    if (rawPath.startsWith('/')) {
      return `${this.localImageServerUrl}${rawPath}`;
    }

    return `${this.localImageServerUrl}/${rawPath}`;
  }

  toggleShelterActions(adoption: AdoptionResponse): void {
    const adoptionId = adoption.idAdoption;

    if (!adoptionId) {
      this.openedAdoptionId = null;
      return;
    }

    this.openedAdoptionId = this.openedAdoptionId === adoptionId ? null : adoptionId;
  }

  isShelterActionsOpen(adoption: AdoptionResponse): boolean {
    return !!adoption.idAdoption && this.openedAdoptionId === adoption.idAdoption;
  }

  getShelterEmail(adoption: AdoptionResponse): string {
    const shelter = this.getShelter(adoption);
    return shelter?.email || shelter?.account?.email || '';
  }

  onMessageShelter(adoption: AdoptionResponse): void {
    this.messageShelter.emit(adoption);
  }

  private getShelter(adoption: AdoptionResponse): ShelterResponse | undefined {
    const shelterId = adoption.shelter?.idShelter;
    if (!shelterId) {
      return undefined;
    }

    for (const shelter of this.shelters) {
      if (shelter.idShelter === shelterId) {
        return shelter;
      }
    }

    return undefined;
  }
}
