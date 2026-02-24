import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TaskService, TaskListItem } from '../../../../core/services/task.service';
import { WebSocketService } from '../../../../core/services/websocket.service';

interface KanbanColumn {
  status: string;
  label: string;
  tasks: TaskListItem[];
}

@Component({
    selector: 'app-kanban-board',
    imports: [CommonModule, DragDropModule, MatCardModule, MatChipsModule, MatIconModule, MatSnackBarModule, RouterModule],
    templateUrl: './kanban-board.component.html',
    styleUrl: './kanban-board.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanBoardComponent implements OnInit, OnDestroy {
  columns: KanbanColumn[] = [
    { status: 'created', label: 'Created', tasks: [] },
    { status: 'in_progress', label: 'In Progress', tasks: [] },
    { status: 'waiting', label: 'Waiting', tasks: [] },
    { status: 'done', label: 'Done', tasks: [] },
  ];

  columnIds: string[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private wsService: WebSocketService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {
    this.columnIds = this.columns.map((c) => c.status);
  }

  ngOnInit(): void {
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

  loadTasks(): void {
    this.taskService.list({ page_size: 100 }).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      for (const col of this.columns) {
        col.tasks = res.results.filter((t) => t.status === col.status);
      }
      this.cdr.markForCheck();
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
