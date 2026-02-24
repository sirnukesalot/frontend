import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, takeUntil } from 'rxjs';
import { TaskService, TaskListItem, PaginatedResponse, TaskFilters } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-task-list',
    imports: [
        CommonModule, RouterModule, MatTableModule, MatButtonModule,
        MatIconModule, MatChipsModule, MatPaginatorModule, MatMenuModule,
    ],
    templateUrl: './task-list.component.html',
    styleUrl: './task-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks: TaskListItem[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;
  isManager = false;
  displayedColumns = ['title', 'status', 'priority', 'assignees', 'client', 'deadline'];
  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isManager = this.authService.hasRole('manager');
    this.loadTasks();
  }

  loadTasks(): void {
    const filters: TaskFilters = { page: this.currentPage, page_size: this.pageSize };
    this.taskService.list(filters).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.tasks = res.results;
      this.totalCount = res.count;
      this.cdr.markForCheck();
    });
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
