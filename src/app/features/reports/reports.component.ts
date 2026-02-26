import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { SummaryService, SummaryListItem } from '../../core/services/summary.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatTableModule, MatChipsModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit, OnDestroy {
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  reportData: any = null;
  dailySummary: SummaryListItem | null = null;
  weeklySummary: SummaryListItem | null = null;
  summaryLoading = false;
  aiDateFrom: Date | null = null;
  aiDateTo: Date | null = null;
  generating = false;
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private summaryService: SummaryService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadLatestSummaries();
  }

  loadLatestSummaries(): void {
    this.summaryLoading = true;
    this.cdr.markForCheck();
    this.summaryService.getLatest().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.dailySummary = data.daily;
        this.weeklySummary = data.weekly;
        this.summaryLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.summaryLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  generateAISummary(): void {
    if (!this.aiDateFrom || !this.aiDateTo) return;
    this.generating = true;
    this.cdr.markForCheck();
    const start = this.aiDateFrom.toISOString().split('T')[0];
    const end = this.aiDateTo.toISOString().split('T')[0];
    this.summaryService.generate(start, end).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.generating = false;
        this.snackBar.open('Summary generation started', 'View', { duration: 5000 }).onAction().subscribe(() => {
          this.router.navigate(['/reports/summaries', result.id]);
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.generating = false;
        this.snackBar.open('Failed to start generation', 'Dismiss', { duration: 3000 });
        this.cdr.markForCheck();
      },
    });
  }

  loadReport(): void {
    let params = new HttpParams();
    if (this.dateFrom) params = params.set('date_from', this.dateFrom.toISOString().split('T')[0]);
    if (this.dateTo) params = params.set('date_to', this.dateTo.toISOString().split('T')[0]);
    this.http.get(`${environment.apiUrl}/reports/summary/`, { params }).pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.reportData = data;
      this.cdr.markForCheck();
    });
  }

  exportPDF(): void {
    let params = new HttpParams();
    if (this.dateFrom) params = params.set('date_from', this.dateFrom.toISOString().split('T')[0]);
    if (this.dateTo) params = params.set('date_to', this.dateTo.toISOString().split('T')[0]);
    this.http.get(`${environment.apiUrl}/reports/export/pdf/`, { params, responseType: 'blob' }).pipe(takeUntil(this.destroy$)).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'report.pdf'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  exportExcel(): void {
    let params = new HttpParams();
    if (this.dateFrom) params = params.set('date_from', this.dateFrom.toISOString().split('T')[0]);
    if (this.dateTo) params = params.set('date_to', this.dateTo.toISOString().split('T')[0]);
    this.http.get(`${environment.apiUrl}/reports/export/excel/`, { params, responseType: 'blob' }).pipe(takeUntil(this.destroy$)).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'report.xlsx'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
