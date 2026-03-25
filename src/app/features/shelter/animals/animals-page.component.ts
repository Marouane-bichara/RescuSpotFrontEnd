import { Component, OnChanges, SimpleChanges, inject, input, output } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ANIMAL_BREED_OPTIONS,
  ANIMAL_GENDER_OPTIONS,
  ANIMAL_SPECIES_OPTIONS,
  AnimalResponse
} from '../../../core/models/animal.model';

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
  selector: 'app-shelter-animals-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './animals-page.component.html'
})
export class ShelterAnimalsPageComponent implements OnChanges {
  private fb = inject(FormBuilder);

  searchText = input('');
  isLoading = input(false);
  filteredAnimals = input<AnimalResponse[]>([]);

  isAnimalModalOpen = input(false);
  isEditMode = input(false);
  animalForm = input<AnimalFormData>(this.getEmptyForm());
  imagePreview = input('');
  formError = input('');
  isSavingAnimal = input(false);

  localImageServerUrl = input('http://localhost:8090');

  searchTextChange = output<string>();
  openCreate = output<void>();
  openEdit = output<AnimalResponse>();
  deleteAnimal = output<number>();
  closeModal = output<void>();
  saveAnimal = output<void>();
  imageSelected = output<Event>();

  speciesOptions = ANIMAL_SPECIES_OPTIONS;
  genderOptions = ANIMAL_GENDER_OPTIONS;
  breedOptions = ANIMAL_BREED_OPTIONS;

  animalReactiveForm = this.fb.group({
    name: ['', Validators.required],
    species: ['DOG', Validators.required],
    breed: ['MIXED', Validators.required],
    gender: ['UNKNOWN', Validators.required],
    age: [null as number | null, Validators.required],
    description: ['', Validators.required]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['animalForm'] || changes['isAnimalModalOpen']) {
      this.fillFormFromInput();
    }
  }

  hasAnimalPicture(animal: AnimalResponse): boolean {
    return this.getAnimalPicture(animal) !== '';
  }

  getAnimalPicture(animal: AnimalResponse): string {
    return this.toImageUrl(animal.picture || '');
  }

  submitAnimalForm(): void {
    if (this.animalReactiveForm.invalid) {
      this.animalReactiveForm.markAllAsTouched();
      return;
    }

    const value = this.animalReactiveForm.getRawValue();
    const form = this.animalForm();
    form.name = String(value.name || '').trim();
    form.species = String(value.species || 'DOG');
    form.breed = String(value.breed || 'MIXED');
    form.gender = String(value.gender || 'UNKNOWN');
    form.age = value.age;
    form.description = String(value.description || '').trim();

    this.saveAnimal.emit();
  }

  isInvalid(controlName: 'name' | 'species' | 'breed' | 'gender' | 'age' | 'description'): boolean {
    const control = this.animalReactiveForm.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  private toImageUrl(value: string): string {
    const path = value.trim();
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return path.startsWith('/') ? `${this.localImageServerUrl()}${path}` : `${this.localImageServerUrl()}/${path}`;
  }

  private fillFormFromInput(): void {
    const form = this.animalForm();

    this.animalReactiveForm.patchValue({
      name: form.name || '',
      species: form.species || 'DOG',
      breed: form.breed || 'MIXED',
      gender: form.gender || 'UNKNOWN',
      age: form.age,
      description: form.description || ''
    }, { emitEvent: false });

    this.animalReactiveForm.markAsPristine();
    this.animalReactiveForm.markAsUntouched();
  }

  private getEmptyForm(): AnimalFormData {
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
}
