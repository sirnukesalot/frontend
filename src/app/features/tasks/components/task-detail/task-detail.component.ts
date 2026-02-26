import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { TaskService, TaskDetail } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { STATUS_LABELS, VALID_TRANSITIONS } from '../../../../core/constants/task-status';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatChipsModule,
    MatButtonModule, MatIconModule, MatListModule, MatDividerModule,
    MatTabsModule, MatProgressBarModule, MatMenuModule, MatSnackBarModule,
  ],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailComponent implements OnInit, OnDestroy {
  task: TaskDetail | null = null;
  isManager = false;
  attachments: any[] = [];
  history: any[] = [];
  historyLoaded = false;
  historyLoading = false;
  uploading = false;
  private taskId!: number;
  private destroy$ = new Subject<void>();
  private readonly historyTabIndex = 1;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.isManager = this.authService.hasRole('manager');
    this.taskId = +this.route.snapshot.params['id'];
    this.taskService.get(this.taskId).pipe(takeUntil(this.destroy$)).subscribe((task) => {
      this.task = task;
      this.cdr.markForCheck();
    });
    this.loadAttachments();
  }

  onTabChange(event: MatTabChangeEvent): void {
    if (event.index === this.historyTabIndex && !this.historyLoaded) {
      this.loadHistory();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading = true;
    this.cdr.markForCheck();
    this.taskService.uploadAttachment(this.taskId, file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.uploading = false;
          input.value = '';
          this.loadAttachments();
        },
        error: () => {
          this.uploading = false;
          input.value = '';
          this.cdr.markForCheck();
        },
      });
  }

  deleteAttachment(attachmentId: number): void {
    this.taskService.deleteAttachment(this.taskId, attachmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadAttachments());
  }

  downloadAttachment(attachmentId: number, filename: string, event: Event): void {
    event.preventDefault();
    this.taskService.downloadAttachment(this.taskId, attachmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  onChangeStatus(newStatus: string): void {
    if (!this.task) return;
    this.taskService.changeStatus(this.task.id, newStatus).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.task!.status = newStatus;
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Failed to change status';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      },
    });
  }

  getHistoryIcon(action: string): string {
    switch (action) {
      case 'created': return 'add_circle';
      case 'updated': return 'edit';
      case 'status_changed': return 'swap_horiz';
      case 'assigned': return 'person_add';
      case 'file_attached': return 'attach_file';
      default: return 'history';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAttachments(): void {
    this.taskService.getAttachments(this.taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.attachments = res.results;
        this.cdr.markForCheck();
      });
  }

  private loadHistory(): void {
    this.historyLoading = true;
    this.cdr.markForCheck();
    this.taskService.getHistory(this.taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.history = res.results;
        this.historyLoaded = true;
        this.historyLoading = false;
        this.cdr.markForCheck();
      });
  }
}
