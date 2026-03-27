import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AnimalResponse } from '../../../core/models/animal.model';

@Component({
  selector: 'app-user-animals-page',
  standalone: true,
  templateUrl: './animals-page.component.html'
})
export class UserAnimalsPageComponent {
  @Input() isLoadingAnimals = false;
  @Input() animalsForAdoption: AnimalResponse[] = [];
  @Input() localImageServerUrl = 'http://localhost:8090';

  @Output() adopt = new EventEmitter<AnimalResponse>();

  getPendingRequestsCount(animal: AnimalResponse): number {
    const adoptions = animal.adoptions || [];
    let count = 0;

    for (const adoption of adoptions) {
      if (this.normalizeStatus(adoption.status) === 'PENDING') {
        count++;
      }
    }

    return count;
  }

  hasAnimalPicture(animal: AnimalResponse): boolean {
    return this.getAnimalPicture(animal) !== '';
  }

  getAnimalPicture(animal: AnimalResponse): string {
    const picturePath = (animal.picture || '').trim();

    if (!picturePath) {
      return '';
    }

    if (picturePath.startsWith('http') || picturePath.startsWith('data:')) {
      return picturePath;
    }

    if (picturePath.startsWith('/')) {
      return `${this.localImageServerUrl}${picturePath}`;
    }

    return `${this.localImageServerUrl}/${picturePath}`;
  }

  private normalizeStatus(status: string | undefined): string {
    return (status || '').toUpperCase();
  }
}
