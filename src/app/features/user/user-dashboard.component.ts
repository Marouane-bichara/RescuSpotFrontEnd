import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimalResponse } from '../../core/models/animal.model';
import { AdoptionResponse } from '../../core/models/adoption.model';
import { AnimalService } from '../../core/services/animal.service';
import { AdoptionService } from '../../core/services/adoption.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ShelterService } from '../../core/services/shelter.service';
import { ShelterResponse } from '../../core/models/shelter.model';
import { UserResponse } from '../../core/models/user.model';
import { UserAnimalsPageComponent } from './animals/animals-page.component';
import { UserReportsPageComponent } from './reports/reports-page.component';
import { UserMessagesPageComponent } from './messages/messages-page.component';
import { UserAdoptionsPageComponent } from './adoptions/adoptions-page.component';
import { UserUsersPageComponent } from './users/users-page.component';

type UserDashboardSection = 'reports' | 'messages' | 'animals' | 'adoptions' | 'users';

interface SidebarItem {
  key: UserDashboardSection;
  label: string;
  emoji: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    UserAnimalsPageComponent,
    UserReportsPageComponent,
    UserMessagesPageComponent,
    UserAdoptionsPageComponent,
    UserUsersPageComponent
  ],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit {
  localImageServerUrl = 'http://localhost:8090';

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private animalService = inject(AnimalService);
  private adoptionService = inject(AdoptionService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private shelterService = inject(ShelterService);

  sidebarOpen = false;
  activeSection: UserDashboardSection = 'animals';

  animals: AnimalResponse[] = [];
  myAdoptions: AdoptionResponse[] = [];
  shelters: ShelterResponse[] = [];
  users: UserResponse[] = [];

  currentUserAccountId: number | null = null;
  activeMessageShelterId: number | null = null;
  activeMessageUserAccountId: number | null = null;

  isLoadingAnimals = false;
  isLoadingAdoptions = false;
  isLoggingOut = false;
  pageError = '';

  currentUserId: number | null = null;

  selectedAnimal: AnimalResponse | null = null;
  isAdopting = false;
  adoptionError = '';
  adoptionSuccess = '';

  sidebarItems: SidebarItem[] = [
    { key: 'reports', label: 'Reports', emoji: '📋' },
    { key: 'messages', label: 'Messages', emoji: '💬' },
    { key: 'animals', label: 'Animals', emoji: '🐾' },
    { key: 'adoptions', label: 'Adoptions', emoji: '🏡' },
    { key: 'users', label: 'Users', emoji: '👥' }
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const section = params.get('section');
      this.applySectionFromRoute(section);
    });

    this.loadAnimals();
    this.loadCurrentUserAndAdoptions();
    this.loadShelters();
  }

  setSection(section: UserDashboardSection): void {
    this.activeSection = section;
    this.sidebarOpen = false;
    this.router.navigate(['/user', section]);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
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

  loadAnimals(): void {
    this.isLoadingAnimals = true;
    this.pageError = '';

    this.animalService.getAllAnimals().subscribe({
      next: (animals) => {
        this.animals = animals || [];
        this.isLoadingAnimals = false;
      },
      error: (error) => {
        this.pageError = error?.error?.message || 'Could not load animals.';
        this.isLoadingAnimals = false;
      }
    });
  }

  loadCurrentUserAndAdoptions(): void {
    const email = this.authService.getCurrentUser()?.email;
    if (!email) {
      return;
    }

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users || [];

        let user: UserResponse | undefined;

        for (const u of users) {
          const accountEmail = u.account?.email || '';
          if (accountEmail.toLowerCase() === email.toLowerCase()) {
            user = u;
            break;
          }
        }

        if (!user) {
          return;
        }

        this.currentUserId = user.idUser;
        this.currentUserAccountId = user.account?.idAccount || user.accountId || null;
        this.loadMyAdoptions();
      },
      error: () => {
      }
    });
  }

  loadMyAdoptions(): void {
    this.isLoadingAdoptions = true;

    this.adoptionService.getAllAdoptions().subscribe({
      next: (adoptions) => {
        if (!this.currentUserId) {
          this.myAdoptions = [];
        } else {
          const mine: AdoptionResponse[] = [];

          for (const adoption of adoptions || []) {
            if (adoption.user?.idUser === this.currentUserId) {
              mine.push(adoption);
            }
          }

          this.myAdoptions = mine;
        }
        this.isLoadingAdoptions = false;
      },
      error: () => {
        this.isLoadingAdoptions = false;
      }
    });
  }

  loadShelters(): void {
    this.shelterService.getAllShelters().subscribe({
      next: (shelters) => {
        this.shelters = shelters || [];
      },
      error: () => {
        this.shelters = [];
      }
    });
  }

  getAnimalsForAdoption(): AnimalResponse[] {
    const result: AnimalResponse[] = [];

    for (const animal of this.animals) {
      if (this.isAnimalAvailable(animal)) {
        result.push(animal);
      }
    }

    return result;
  }

  isAnimalAvailable(animal: AnimalResponse): boolean {
    const adoptions = animal.adoptions || [];

    for (const adoption of adoptions) {
      if (this.normalizeStatus(adoption.status) === 'APPROVED') {
        return false;
      }
    }

    return true;
  }

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

  openAdoptionModal(animal: AnimalResponse): void {
    this.selectedAnimal = animal;
    this.adoptionError = '';
    this.adoptionSuccess = '';
  }

  closeAdoptionModal(): void {
    this.selectedAnimal = null;
    this.adoptionError = '';
    this.adoptionSuccess = '';
  }

  adoptSelectedAnimal(): void {
    if (!this.selectedAnimal) {
      return;
    }

    if (!this.currentUserId) {
      this.adoptionError = 'Your user profile was not found yet. Please refresh and try again.';
      return;
    }

    const shelterId = this.selectedAnimal.shelter?.idShelter;
    if (!shelterId) {
      this.adoptionError = 'Shelter information is missing for this animal.';
      return;
    }

    this.isAdopting = true;
    this.adoptionError = '';
    this.adoptionSuccess = '';

    this.adoptionService.createAdoption({
      animalId: this.selectedAnimal.idAnimal,
      userId: this.currentUserId,
      shelterId: shelterId,
      requestDate: new Date().toISOString()
    }).subscribe({
      next: () => {
        this.isAdopting = false;
        this.adoptionSuccess = 'Adoption request sent successfully. Status is now pending.';
        this.loadAnimals();
        this.loadMyAdoptions();
      },
      error: (error) => {
        this.isAdopting = false;
        this.adoptionError = error?.error?.message || 'Could not send adoption request.';
      }
    });
  }

  getAnimalPicture(animal: AnimalResponse): string {
    const picturePath = (animal.picture || '').trim();

    if (!picturePath) {
      return 'https://placehold.co/800x500/0f172a/cbd5e1?text=No+Image';
    }

    if (picturePath.startsWith('http') || picturePath.startsWith('data:')) {
      return picturePath;
    }

    if (picturePath.startsWith('/')) {
      return `${this.localImageServerUrl}${picturePath}`;
    }

    return `${this.localImageServerUrl}/${picturePath}`;
  }

  getMyAdoptionsCount(status: 'PENDING' | 'APPROVED' | 'REJECTED'): number {
    let count = 0;

    for (const adoption of this.myAdoptions) {
      if (this.normalizeStatus(adoption.status) === status) {
        count++;
      }
    }

    return count;
  }

  openMessagesForShelter(adoption: AdoptionResponse): void {
    const shelterId = adoption.shelter?.idShelter;
    if (!shelterId) {
      return;
    }

    this.activeMessageShelterId = shelterId;
    this.activeMessageUserAccountId = null;
    this.setSection('messages');
  }

  openMessagesForUser(accountId: number): void {
    this.activeMessageUserAccountId = accountId;
    this.activeMessageShelterId = null;
    this.setSection('messages');
  }

  private normalizeStatus(status: string | undefined): string {
    return (status || '').toUpperCase();
  }

  private applySectionFromRoute(section: string | null): void {
    if (section === 'reports' || section === 'messages' || section === 'animals' || section === 'adoptions' || section === 'users') {
      this.activeSection = section;
      return;
    }

    this.activeSection = 'animals';
  }
}
