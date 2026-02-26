import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TaskService, TaskListItem, TaskFilters } from '../../../../core/services/task.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { STATUS_LABELS, VALID_TRANSITIONS } from '../../../../core/constants/task-status';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { FilterPanelComponent, FilterState } from '../filter-panel/filter-panel.component';

interface KanbanColumn {
  status: string;
  label: string;
  tasks: TaskListItem[];
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, MatCardModule, MatChipsModule, MatIconModule, MatSnackBarModule, MatMenuModule, MatButtonModule, RouterModule, SearchBarComponent, FilterPanelComponent],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanBoardComponent implements OnInit, OnDestroy {
  columns: KanbanColumn[] = [
    { status: 'created', label: 'Created', tasks: [] },
    { status: 'in_progress', label: 'In Progress', tasks: [] },
    { status: 'waiting', label: 'Waiting', tasks: [] },
    { status: 'done', label: 'Done', tasks: [] },
  ];

  columnIds: string[] = [];
  private searchTerm = '';
  private activeFilters: FilterState = {};
  private destroy$ = new Subject<void>();

  isManager = false;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private wsService: WebSocketService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {
    this.columnIds = this.columns.map((c) => c.status);
  }

  ngOnInit(): void {
    this.isManager = this.authService.hasRole('manager');
    this.loadTasks();
    this.wsService.connect();
    this.wsService.messages$.pipe(takeUntil(this.destroy$)).subscribe((msg) => {
      if (msg.type === 'task_status_changed') {
        this.handleStatusChange(msg.payload);
      } else if (msg.type === 'task_created') {
        this.loadTasks();
      }
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.loadTasks();
  }

  onFiltersChange(filters: FilterState): void {
    this.activeFilters = filters;
    this.loadTasks();
  }

  loadTasks(): void {
    const filters: TaskFilters = { page_size: 100, ...this.activeFilters };
    if (this.searchTerm) {
      filters.search = this.searchTerm;
    }
    this.taskService.list(filters).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      for (const col of this.columns) {
        col.tasks = res.results.filter((t) => t.status === col.status);
      }
      this.cdr.markForCheck();
    });
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] || status;
  }

  getNextStatuses(currentStatus: string): string[] {
    return VALID_TRANSITIONS[currentStatus] || [];
  }

  onMenuChangeStatus(task: TaskListItem, currentCol: KanbanColumn, newStatus: string): void {
    this.taskService.changeStatus(task.id, newStatus).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const idx = currentCol.tasks.indexOf(task);
        if (idx >= 0) currentCol.tasks.splice(idx, 1);
        task.status = newStatus;
        const targetCol = this.columns.find((c) => c.status === newStatus);
        targetCol?.tasks.push(task);
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Invalid transition';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      },
    });
  }

  onDrop(event: CdkDragDrop<TaskListItem[]>, targetCol: KanbanColumn): void {
    if (event.previousContainer === event.container) return;
    const task = event.previousContainer.data[event.previousIndex];
    this.taskService.changeStatus(task.id, targetCol.status).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        event.previousContainer.data.splice(event.previousIndex, 1);
        task.status = targetCol.status;
        event.container.data.splice(event.currentIndex, 0, task);
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Invalid transition';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      },
    });
  }

  private handleStatusChange(payload: any): void {
    const taskId = payload.task_id;
    const newStatus = payload.new_status;
    for (const col of this.columns) {
      const idx = col.tasks.findIndex((t) => t.id === taskId);
      if (idx >= 0) {
        const [task] = col.tasks.splice(idx, 1);
        task.status = newStatus;
        const target = this.columns.find((c) => c.status === newStatus);
        target?.tasks.push(task);
        break;
      }
    }
  }
}
