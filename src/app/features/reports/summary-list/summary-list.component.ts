import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SummaryService, SummaryListItem } from '../../../core/services/summary.service';

@Component({
  selector: 'app-summary-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatButtonToggleModule, MatIconModule, MatChipsModule,
    MatPaginatorModule,
  ],
  templateUrl: './summary-list.component.html',
  styleUrl: './summary-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryListComponent implements OnInit, OnDestroy {
  summaries: SummaryListItem[] = [];
  totalCount = 0;
  currentPage = 0;
  selectedPeriod = '';
  displayedColumns = ['period', 'period_type', 'status', 'method', 'preview', 'generated_at'];
  private destroy$ = new Subject<void>();

  constructor(
    private summaryService: SummaryService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadSummaries();
  }

  loadSummaries(): void {
    const filters: any = { page: this.currentPage + 1 };
    if (this.selectedPeriod) {
      filters.period_type = this.selectedPeriod;
    }
    this.summaryService.list(filters).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.summaries = res.results;
      this.totalCount = res.count;
      this.cdr.markForCheck();
    });
  }

  onPage(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.loadSummaries();
  }

  viewSummary(summary: SummaryListItem): void {
    this.router.navigate(['/reports/summaries', summary.id]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
