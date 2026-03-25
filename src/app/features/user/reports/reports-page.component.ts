import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { HealthAnimalStatus, ReportResponse } from '../../../core/models/report.model';
import { ReportService } from '../../../core/services/report.service';

@Component({
  selector: 'app-user-reports-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reports-page.component.html'
})
export class UserReportsPageComponent implements OnChanges {
  @Input() currentUserId: number | null = null;
  @Input() localImageServerUrl = 'http://localhost:8090';

  private reportService = inject(ReportService);

  location = '';
  description = '';
  healthStatus: HealthAnimalStatus = 'UNKNOWN';

  healthOptions: HealthAnimalStatus[] = [
    'HEALTHY',
    'MINOR_INJURY',
    'INJURED',
    'SERIOUSLY_INJURED',
    'SICK',
    'MALNOURISHED',
    'ABUSED',
    'DEAD',
    'UNKNOWN'
  ];

  reports = signal<ReportResponse[]>([]);
  uploadedPhotos = signal<string[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  isUploadingPhoto = signal(false);
  deletingId = signal<number | null>(null);
  formError = signal('');
  pageError = signal('');
  pageSuccess = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUserId']) {
      this.loadMyReports();
    }
  }

  loadMyReports(): void {
    if (!this.currentUserId) {
      this.reports.set([]);
      return;
    }

    this.isLoading.set(true);
    this.pageError.set('');

    this.reportService.getAllReports().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (allReports) => {
        const mine = (allReports || []).filter((report) => report.userId === this.currentUserId);
        this.reports.set(mine.sort((a, b) => String(b.reportedAt).localeCompare(String(a.reportedAt))));
      },
      error: (error) => {
        this.pageError.set(error?.error?.message || 'Could not load reports.');
      }
    });
  }

  createReport(): void {
    if (!this.currentUserId) {
      this.formError.set('User not found. Please re-login.');
      return;
    }

    if (!this.location.trim() || !this.description.trim()) {
      this.formError.set('Location and description are required.');
      return;
    }

    this.isSaving.set(true);
    this.formError.set('');
    this.pageSuccess.set('');

    this.reportService.createReport({
      userId: this.currentUserId,
      location: this.location.trim(),
      photos: this.uploadedPhotos(),
      healthStatus: this.healthStatus,
      description: this.description.trim()
    }).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.pageSuccess.set('Report sent successfully.');
        this.location = '';
        this.description = '';
        this.healthStatus = 'UNKNOWN';
        this.uploadedPhotos.set([]);
        this.loadMyReports();
      },
      error: (error) => {
        this.formError.set(error?.error?.message || 'Could not create report.');
      }
    });
  }

  async onPhotosSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) {
      return;
    }

    this.isUploadingPhoto.set(true);
    this.formError.set('');

    try {
      const newPhotoPaths: string[] = [];

      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const dataUrl = await this.readFileAsDataUrl(file);
        const path = await this.uploadImageToLocalServer(fileName, dataUrl);
        newPhotoPaths.push(path);
      }

      this.uploadedPhotos.update((current) => [...current, ...newPhotoPaths]);
    } catch {
      this.formError.set('Could not upload photo. Make sure local image server is running.');
    } finally {
      this.isUploadingPhoto.set(false);
      input.value = '';
    }
  }

  removePhoto(path: string): void {
    this.uploadedPhotos.update((current) => current.filter((item) => item !== path));
  }

  getPhotoUrl(path: string): string {
    if (!path) {
      return '';
    }

    if (path.startsWith('http') || path.startsWith('data:')) {
      return path;
    }

    if (path.startsWith('/')) {
      return `${this.localImageServerUrl}${path}`;
    }

    return `${this.localImageServerUrl}/${path}`;
  }

  deleteReport(reportId: number): void {
    this.deletingId.set(reportId);
    this.pageError.set('');
    this.pageSuccess.set('');

    this.reportService.deleteReport(reportId).pipe(
      finalize(() => this.deletingId.set(null))
    ).subscribe({
      next: () => {
        this.pageSuccess.set('Report deleted successfully.');
        this.loadMyReports();
      },
      error: (error) => {
        this.pageError.set(error?.error?.message || 'Could not delete report.');
      }
    });
  }

  getReportId(report: ReportResponse): number | null {
    const candidate = report.idReport ?? report.id;
    return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null;
  }

  onDeleteReport(report: ReportResponse): void {
    const reportId = this.getReportId(report);
    if (reportId == null) {
      this.pageError.set('This report has no valid ID, so it cannot be deleted.');
      return;
    }

    this.deleteReport(reportId);
  }

  formatDate(value: string | Date): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString();
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
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
}
