import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SummaryService, SummaryDetail, SummaryVersion } from '../../../core/services/summary.service';

@Component({
  selector: 'app-summary-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatListModule, MatDividerModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './summary-list.component.html',
  styleUrl: './summary-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryDetailComponent implements OnInit, OnDestroy {
  summary: SummaryDetail | null = null;
  versions: SummaryVersion[] = [];
  loading = false;
  regenerating = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private summaryService: SummaryService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.loadSummary(+params['id']);
    });
  }

  loadSummary(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.summaryService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.summary = data;
        this.loading = false;
        this.cdr.markForCheck();
        this.loadVersions(id);
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadVersions(id: number): void {
    this.summaryService.getVersions(id).pipe(takeUntil(this.destroy$)).subscribe((versions) => {
      this.versions = versions;
      this.cdr.markForCheck();
    });
  }

  switchVersion(version: SummaryVersion): void {
    this.router.navigate(['/reports/summaries', version.id]);
  }

  regenerate(): void {
    if (!this.summary) return;
    this.regenerating = true;
    this.cdr.markForCheck();
    this.summaryService.regenerate(this.summary.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (newSummary) => {
        this.regenerating = false;
        this.snackBar.open('Regeneration started', 'View', { duration: 5000 }).onAction().subscribe(() => {
          this.router.navigate(['/reports/summaries', newSummary.id]);
        });
        this.cdr.markForCheck();
        // Reload versions to show the new one
        this.loadVersions(this.summary!.id);
      },
      error: () => {
        this.regenerating = false;
        this.snackBar.open('Regeneration failed', 'Dismiss', { duration: 3000 });
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
