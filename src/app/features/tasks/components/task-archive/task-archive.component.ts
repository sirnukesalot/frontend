import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { TaskService, TaskListItem, TaskFilters } from '../../../../core/services/task.service';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';

@Component({
  selector: 'app-task-archive',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatChipsModule,
    MatPaginatorModule, MatIconModule, SearchBarComponent,
  ],
  templateUrl: './task-archive.component.html',
  styleUrl: './task-archive.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskArchiveComponent implements OnInit, OnDestroy {
  tasks: TaskListItem[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;
  displayedColumns = ['title', 'priority', 'assignees', 'client', 'tags', 'deadline'];
  private searchTerm = '';
  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    const filters: TaskFilters = {
      page: this.currentPage,
      page_size: this.pageSize,
      status: 'archived',
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

  onSearch(term: string): void {
    this.searchTerm = term;
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