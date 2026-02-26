import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { TaskService, TaskListItem, PaginatedResponse, TaskFilters } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { STATUS_LABELS, VALID_TRANSITIONS } from '../../../../core/constants/task-status';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { FilterPanelComponent, FilterState } from '../filter-panel/filter-panel.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatPaginatorModule, MatMenuModule, MatSnackBarModule,
    SearchBarComponent, FilterPanelComponent,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks: TaskListItem[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;
  isManager = false;
  canCreate = false;
  displayedColumns = ['space', 'title', 'status', 'priority', 'assignees', 'client', 'tags', 'deadline'];
  private searchTerm = '';
  private activeFilters: FilterState = {};
  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.isManager = this.authService.hasRole('manager');
    this.canCreate = this.authService.hasAnyRole('manager', 'engineer');
    this.loadTasks();
  }

  loadTasks(): void {
    const filters: TaskFilters = {
      page: this.currentPage,
      page_size: this.pageSize,
      ...this.activeFilters,
    };
    if (this.searchTerm) {
      filters.search = this.searchTerm;
    }
    this.taskService.list(filters).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.tasks = res.results;
      this.totalCount = res.count;
      this.cdr.markForCheck();
    });
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] || status;
  }

  getNextStatuses(currentStatus: string): string[] {
    const transitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!this.isManager) {
      return transitions.filter((s: string) => !(currentStatus === 'done' && s === 'archived'));
    }
    return transitions;
  }

  onChangeStatus(task: TaskListItem, newStatus: string): void {
    this.taskService.changeStatus(task.id, newStatus).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        task.status = newStatus;
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Failed to change status';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadTasks();
  }

  onFiltersChange(filters: FilterState): void {
    this.activeFilters = filters;
    this.currentPage = 1;
    this.loadTasks();
  }

  isLightColor(hex: string): boolean {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  }


  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
