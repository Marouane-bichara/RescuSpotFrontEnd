import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, of, switchMap } from 'rxjs';
import { ReportResponse, ReportStatus } from '../../../core/models/report.model';
import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShelterService } from '../../../core/services/shelter.service';

@Component({
  selector: 'app-shelter-reports-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reports-page.component.html'
})
export class ShelterReportsPageComponent {
  @Input() currentShelterAccountId: number | null = null;

  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private shelterService = inject(ShelterService);
  localImageServerUrl = 'http://localhost:8090';
  currentShelterId = signal<number | null>(null);

  reports = signal<ReportResponse[]>([]);
  selectedStatusById = signal<Record<number, ReportStatus>>({});
  isLoading = signal(false);
  pageError = signal('');
  pageSuccess = signal('');
  updatingId = signal<number | null>(null);
  searchText = '';

  readonly statusOptions: ReportStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'];

  constructor() {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading.set(true);
    this.pageError.set('');

    this.reportService.getAllReports().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => {
        const all = (data || []).sort((a, b) => String(b.reportedAt).localeCompare(String(a.reportedAt)));
        this.reports.set(all);

        const selectedMap: Record<number, ReportStatus> = {};
        for (const report of all) { 
          const reportId = this.getReportId(report);
          if (reportId == null) {
            continue;
          }

          selectedMap[reportId] = this.normalizeReportStatus(report.reportStatus);
        }
        this.selectedStatusById.set(selectedMap);
      },
      error: (error) => {
        this.pageError.set(error?.error?.message || 'Could not load reports.');
      }
    });
  }

  getFilteredReports(): ReportResponse[] {
    const text = this.searchText.trim().toLowerCase();
    if (!text) {
      return this.reports();
    }

    return this.reports().filter((report) => {
      const location = (report.location || '').toLowerCase();
      const description = (report.description || '').toLowerCase();
      const status = (report.reportStatus || '').toLowerCase();
      const health = (report.healthStatus || '').toLowerCase();
      const reporter = `${report.userFirstName || ''} ${report.userLastName || ''}`.trim().toLowerCase();
      return location.includes(text) || description.includes(text) || status.includes(text) || health.includes(text) || reporter.includes(text);
    });
  }

  getSelectedStatus(reportId: number): ReportStatus {
    return this.normalizeReportStatus(this.selectedStatusById()[reportId]);
  }

  setSelectedStatus(reportId: number, status: ReportStatus): void {
    this.selectedStatusById.update((current) => ({
      ...current,
      [reportId]: this.normalizeReportStatus(status)
    }));
  }

  updateStatus(report: ReportResponse): void {
    if (!this.authService.hasRole('SHELTER')) {
      this.pageError.set('Access denied. Please login with a shelter account.');
      return;
    }

    const reportId = this.getReportId(report);
    if (reportId == null) {
      this.pageError.set('This report has no valid ID, so status cannot be updated.');
      return;
    }

    if (!this.currentShelterAccountId) {
      this.pageError.set('Shelter account ID is missing. Please re-login.');
      return;
    }

    const nextStatus = this.normalizeReportStatus(this.getSelectedStatus(reportId));
    const currentStatus = this.normalizeReportStatus(report.reportStatus);

    if (nextStatus === currentStatus) {
      return;
    }

    this.updatingId.set(reportId);
    this.pageError.set('');
    this.pageSuccess.set('');

    const existingShelterId = this.currentShelterId();
    const shelterId$ = existingShelterId
      ? of(existingShelterId)
      : this.shelterService.getShelterIdByAccountId(this.currentShelterAccountId).pipe(
        switchMap((shelterId) => {
          this.currentShelterId.set(shelterId || null);
          return of(shelterId);
        })
      );

    shelterId$.pipe(
      switchMap((shelterId) => {
        if (!shelterId) {
          throw new Error('Shelter ID not found for this account.');
        }

        return this.reportService.updateReportStatus(reportId, {
          newStatus: nextStatus,
          shelterId
        });
      }),
      finalize(() => this.updatingId.set(null))
    ).subscribe({
      next: (updatedReport) => {
        const updatedStatus = this.normalizeReportStatus(updatedReport?.reportStatus || nextStatus);

        this.reports.update((current) => current.map((item) => {
          if (this.getReportId(item) !== reportId) {
            return item;
          }

          return {
            ...item,
            reportStatus: updatedStatus
          };
        }));

        this.setSelectedStatus(reportId, updatedStatus);
        this.pageSuccess.set(`Report #${reportId} status updated to ${updatedStatus}.`);
      },
      error: (error) => {
        if (error?.status === 403) {
          this.pageError.set('403 Forbidden. Your token is valid but missing shelter permission for this action.');
          return;
        }

        this.pageError.set(error?.error?.message || 'Could not update report status.');
      }
    });
  }

  getReportId(report: ReportResponse): number | null {
    const candidate = report.idReport ?? report.id;
    return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null;
  }

  formatDate(value: string | Date): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString();
  }

  getReporterName(report: ReportResponse): string {
    const fullName = `${report.userFirstName || ''} ${report.userLastName || ''}`.trim();
    return fullName || `User #${report.userId}`;
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

  private normalizeReportStatus(value: ReportStatus | string | null | undefined): ReportStatus {
    const normalized = String(value || '').toUpperCase().trim();
    return this.statusOptions.includes(normalized as ReportStatus)
      ? (normalized as ReportStatus)
      : 'PENDING';
  }
}
