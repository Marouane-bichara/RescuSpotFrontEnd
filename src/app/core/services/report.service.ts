import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReportRequest, ReportResponse, ReportStatusUpdateRequest } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private baseUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  createReport(payload: ReportRequest): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(this.baseUrl, payload);
  }

  getAllReports(): Observable<ReportResponse[]> {
    return this.http.get<ReportResponse[]>(this.baseUrl);
  }

  getReportById(id: number): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.baseUrl}/${id}`);
  }

  updateReportStatus(id: number, payload: ReportStatusUpdateRequest): Observable<ReportResponse> {
    return this.http.patch<ReportResponse>(`${this.baseUrl}/${id}/status`, payload);
  }

  deleteReport(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
