import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AnimalRequest,
  AnimalResponse
} from '../../core/models/animal.model';
import { AdoptionStatus } from '../../core/models/adoption.model';
import { ShelterResponse } from '../../core/models/shelter.model';
import { UserResponse } from '../../core/models/user.model';
import { AnimalService } from '../../core/services/animal.service';
import { AdoptionService } from '../../core/services/adoption.service';
import { ShelterService } from '../../core/services/shelter.service';
import { AuthService } from '../../core/services/auth.service';
import { ShelterAnimalsPageComponent } from './animals/animals-page.component';
import { ShelterRequestsPageComponent } from './requests/requests-page.component';
import { ShelterMessagesPageComponent } from './messages/messages-page.component';
import { ShelterReportsPageComponent } from './reports/reports-page.component';
import { ShelterUsersPageComponent } from './users/users-page.component';

type ShelterDashboardSection = 'requests' | 'messages' | 'animals' | 'reports' | 'users';

interface SidebarItem {
  key: ShelterDashboardSection;
  label: string;
  emoji: string;
}

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

interface AnimalFormData {
  name: string;
  species: string;
  breed: string;
  gender: string;
  age: number | null;
  description: string;
  picture: string;
}

@Component({
  selector: 'app-shelter-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ShelterAnimalsPageComponent,
    ShelterRequestsPageComponent,
    ShelterMessagesPageComponent,
    ShelterReportsPageComponent,
    ShelterUsersPageComponent
  ],
  templateUrl: './shelter-dashboard.component.html',
  styleUrl: './shelter-dashboard.component.css'
})
export class ShelterDashboardComponent implements OnInit {
  localImageServerUrl = 'http://localhost:8090';

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private animalService = inject(AnimalService);
  private adoptionService = inject(AdoptionService);
  private shelterService = inject(ShelterService);
  private authService = inject(AuthService);

  sidebarOpen = false;
  activeSection: ShelterDashboardSection = 'animals';

  currentShelter: ShelterResponse | null = null;
  currentShelterAccountId: number | null = null;
  activeMessageUserAccountId: number | null = null;
  myAnimals: AnimalResponse[] = [];
  myAdoptionRequests: ShelterAdoptionRequestItem[] = [];
  users: UserResponse[] = [];

  searchText = '';

  pageError = '';
  pageSuccess = '';
  isLoading = false;
  isLoggingOut = false;
  reviewingAdoptionId: number | null = null;

  isAnimalModalOpen = false;
  isEditMode = false;
  selectedAnimalId: number | null = null;
  formError = '';
  isSavingAnimal = false;
  imagePreview = '';

  animalForm: AnimalFormData = this.getEmptyAnimalForm();

  sidebarItems: SidebarItem[] = [
    { key: 'requests', label: 'Adoption Requests', emoji: '📬' },
    { key: 'messages', label: 'Messages', emoji: '💬' },
    { key: 'animals', label: 'Animals', emoji: '🐾' },
    { key: 'reports', label: 'Reports', emoji: '📋' },
    { key: 'users', label: 'Users', emoji: '👥' }
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const section = params.get('section');
      this.applySectionFromRoute(section);
      this.ensureUsersLoadedForSection();
    });

    this.loadShelterAndAnimals();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  setSection(section: ShelterDashboardSection): void {
    this.activeSection = section;
    this.ensureUsersLoadedForSection();
    this.sidebarOpen = false;
    this.router.navigate(['/shelter', section]);
  }

  getSectionTitle(): string {
    for (const item of this.sidebarItems) {
      if (item.key === this.activeSection) {
        return item.label;
      }
    }

    return 'Dashboard';
  }

  logout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    this.authService.logout();
  }

  loadShelterAndAnimals(): void {
    this.pageError = '';
    this.pageSuccess = '';
    this.isLoading = true;

    const currentUser = this.authService.getCurrentUser();
    const email = currentUser?.email || '';

    if (!email) {
      this.pageError = 'Could not detect your account email.';
      this.isLoading = false;
      return;
    }

    this.shelterService.getAllShelters().subscribe({
      next: (shelters) => {
        let shelter: ShelterResponse | undefined;

        for (const item of shelters) {
          const itemEmail = (item.email || item.account?.email || '').toLowerCase();
          if (itemEmail === email.toLowerCase()) {
            shelter = item;
            break;
          }
        }

        if (!shelter) {
          this.pageError = 'Shelter profile was not found for this account.';
          this.isLoading = false;
          return;
        }

        this.currentShelter = shelter;
        this.currentShelterAccountId = shelter.accountId || shelter.account?.idAccount || null;
        this.loadMyAnimals();
        this.loadShelterAdoptionRequests();
      },
      error: (error) => {
        this.pageError = error?.error?.message || 'Could not load shelter profile.';
        this.isLoading = false;
      }
    });
  }

  loadMyAnimals(): void {
    if (!this.currentShelter) {
      this.isLoading = false;
      return;
    }

    this.animalService.getAllAnimals().subscribe({
      next: (animals) => {
        const shelterId = this.currentShelter?.idShelter;
        const mine: AnimalResponse[] = [];

        for (const animal of animals || []) {
          if (animal.shelter?.idShelter === shelterId) {
            mine.push(animal);
          }
        }

        this.myAnimals = mine;
        this.isLoading = false;
      },
      error: (error) => {
        this.pageError = error?.error?.message || 'Could not load animals.';
        this.isLoading = false;
      }
    });
  }

  loadShelterAdoptionRequests(): void {
    if (!this.currentShelter?.idShelter) {
      return;
    }

    const shelterId = this.currentShelter.idShelter;

    this.adoptionService.getAllAdoptions().subscribe({
      next: (adoptions) => {
        const requests: ShelterAdoptionRequestItem[] = [];

        for (const adoption of adoptions || []) {
          if (adoption.shelter?.idShelter !== shelterId) {
            continue;
          }

            const firstName = adoption.user?.firstName || '';
            const lastName = adoption.user?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();

          requests.push({
            idAdoption: adoption.idAdoption || null,
            animalId: adoption.animal?.idAnimal || 0,
            animalName: adoption.animal?.name || 'Unknown animal',
            requesterName: fullName || adoption.user?.account?.email || 'Unknown user',
            requesterAccountId: adoption.user?.account?.idAccount || null,
            requesterPhoto: adoption.user?.account?.profilePhoto || '',
            status: (adoption.status || 'PENDING').toUpperCase(),
            requestDate: adoption.requestDate ? String(adoption.requestDate) : ''
          });
        }

        this.myAdoptionRequests = this.sortRequestsByDateDescSimple(requests);
        this.loadUsersFromRequests();
      },
      error: () => {
      }
    });
  }

  openMessagesForUser(userAccountId: number): void {
    this.activeMessageUserAccountId = userAccountId;
    this.setSection('messages');
  }

  reviewAdoption(adoptionId: number, status: AdoptionStatus): void {
    this.reviewingAdoptionId = adoptionId;
    this.pageError = '';
    this.pageSuccess = '';

    this.adoptionService.reviewAdoption(adoptionId, { status }).subscribe({
      next: () => {
        this.reviewingAdoptionId = null;
        this.pageSuccess = `Adoption request ${status.toLowerCase()} successfully.`;
        this.loadShelterAdoptionRequests();
      },
      error: (error) => {
        this.reviewingAdoptionId = null;
        this.pageError = error?.error?.message || 'Could not review adoption request.';
      }
    });
  }

  getFilteredAnimals(): AnimalResponse[] {
    const text = this.searchText.trim().toLowerCase();

    if (!text) {
      return this.myAnimals;
    }

    const filtered: AnimalResponse[] = [];

    for (const animal of this.myAnimals) {
      const name = (animal.name || '').toLowerCase();
      const species = (animal.species || '').toLowerCase();
      const breed = (animal.breed || '').toLowerCase();

      if (name.indexOf(text) >= 0 || species.indexOf(text) >= 0 || breed.indexOf(text) >= 0) {
        filtered.push(animal);
      }
    }

    return filtered;
  }

  openCreateAnimalModal(): void {
    this.isAnimalModalOpen = true;
    this.isEditMode = false;
    this.selectedAnimalId = null;
    this.formError = '';
    this.imagePreview = '';
    this.animalForm = this.getEmptyAnimalForm();
  }

  openEditAnimalModal(animal: AnimalResponse): void {
    this.isAnimalModalOpen = true;
    this.isEditMode = true;
    this.selectedAnimalId = animal.idAnimal;
    this.formError = '';

    this.animalForm = {
      name: animal.name || '',
      species: animal.species || 'DOG',
      breed: animal.breed || 'MIXED',
      gender: animal.gender || 'UNKNOWN',
      age: animal.age ?? null,
      description: animal.description || '',
      picture: animal.picture || ''
    };

    this.imagePreview = this.resolveAnimalPicture(animal.picture || '');
  }

  closeAnimalModal(): void {
    this.isAnimalModalOpen = false;
    this.formError = '';
    this.isSavingAnimal = false;
    this.imagePreview = '';
  }

  onAnimalImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    if (!file) {
      return;
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    const reader = new FileReader();
    reader.onload = async () => {
      const fileData = String(reader.result || '');

      if (!fileData) {
        this.formError = 'Could not read the selected image.';
        return;
      }

      try {
        const picturePath = await this.uploadImageToLocalServer(fileName, fileData);
        this.animalForm.picture = picturePath;
        this.imagePreview = `${this.localImageServerUrl}${picturePath}`;
        this.formError = '';
      } catch {
        this.formError = 'Could not save image in project folder. Make sure local image server is running.';
      }
    };

    reader.onerror = () => {
      this.formError = 'Could not read the selected image.';
    };

    reader.readAsDataURL(file);
  }

  saveAnimal(): void {
    if (!this.currentShelter) {
      this.formError = 'Shelter information is missing.';
      return;
    }

    if (!this.animalForm.name || this.animalForm.age === null || !this.animalForm.description) {
      this.formError = 'Please fill all required fields.';
      return;
    }

    const payload: AnimalRequest = {
      name: this.animalForm.name,
      species: this.animalForm.species,
      breed: this.animalForm.breed,
      gender: this.animalForm.gender,
      age: this.animalForm.age,
      description: this.animalForm.description,
      picture: this.animalForm.picture,
      shelterId: this.currentShelter.idShelter
    };

    this.isSavingAnimal = true;
    this.formError = '';

    const request$ = this.isEditMode && this.selectedAnimalId
      ? this.animalService.updateAnimal(this.selectedAnimalId, payload)
      : this.animalService.createAnimal(payload);

    request$.subscribe({
      next: () => {
        this.isSavingAnimal = false;
        this.pageSuccess = this.isEditMode ? 'Animal updated successfully.' : 'Animal created successfully.';
        this.closeAnimalModal();
        this.loadMyAnimals();
      },
      error: (error) => {
        this.isSavingAnimal = false;
        this.formError = this.isEditMode
          ? (error?.error?.message || 'Could not update animal.')
          : (error?.error?.message || 'Could not create animal.');
      }
    });
  }

  deleteAnimal(animalId: number): void {
    const confirmed = confirm('Are you sure you want to delete this animal?');
    if (!confirmed) {
      return;
    }

    this.animalService.deleteAnimal(animalId).subscribe({
      next: () => {
        this.pageSuccess = 'Animal deleted successfully.';
        this.loadMyAnimals();
      },
      error: (error) => {
        this.pageError = error?.error?.message || 'Could not delete animal.';
      }
    });
  }

  getRequestsCount(status: 'PENDING' | 'APPROVED' | 'REJECTED'): number {
    let count = 0;

    for (const item of this.myAdoptionRequests) {
      if (item.status === status) {
        count++;
      }
    }

    return count;
  }

  loadUsers(): void {
    this.loadUsersFromRequests();
  }

  private getEmptyAnimalForm(): AnimalFormData {
    return {
      name: '',
      species: 'DOG',
      breed: 'MIXED',
      gender: 'UNKNOWN',
      age: null,
      description: '',
      picture: ''
    };
  }

  private resolveAnimalPicture(rawPath: string): string {
    const path = rawPath.trim();
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return path.startsWith('/') ? `${this.localImageServerUrl}${path}` : `${this.localImageServerUrl}/${path}`;
  }

  private async uploadImageToLocalServer(fileName: string, dataUrl: string): Promise<string> {
    const response = await fetch(`${this.localImageServerUrl}/upload/animal-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName, dataUrl })
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return String(result.path || '');
  }

  private applySectionFromRoute(section: string | null): void {
    if (section === 'requests' || section === 'messages' || section === 'animals' || section === 'reports' || section === 'users') {
      this.activeSection = section;
      return;
    }

    this.activeSection = 'animals';
  }

  private ensureUsersLoadedForSection(): void {
    if ((this.activeSection === 'users' || this.activeSection === 'messages') && this.users.length === 0) {
      this.loadUsers();
    }
  }

  private loadUsersFromRequests(): void {
    const mappedUsers: UserResponse[] = [];
    const seen = new Set<number>();

    for (const request of this.myAdoptionRequests) {
      const accountId = request.requesterAccountId;
      if (!accountId || seen.has(accountId)) {
        continue;
      }

      seen.add(accountId);

      const rawParts = (request.requesterName || '').trim().split(/\s+/);
      const parts: string[] = [];

      for (const rawPart of rawParts) {
        if (rawPart) {
          parts.push(rawPart);
        }
      }

      const firstName = parts.length > 0 ? parts[0] : `User`;
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

      mappedUsers.push({
        idUser: accountId,
        accountId,
        firstName,
        lastName,
        account: {
          idAccount: accountId,
          profilePhoto: request.requesterPhoto
        }
      });
    }

    this.users = mappedUsers;
  }

  private sortRequestsByDateDescSimple(list: ShelterAdoptionRequestItem[]): ShelterAdoptionRequestItem[] {
    const sorted: ShelterAdoptionRequestItem[] = [];

    for (const item of list) {
      sorted.push(item);
    }

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const left = sorted[i].requestDate || '';
        const right = sorted[j].requestDate || '';

        if (right > left) {
          const temp = sorted[i];
          sorted[i] = sorted[j];
          sorted[j] = temp;
        }
      }
    }

    return sorted;
  }
}
