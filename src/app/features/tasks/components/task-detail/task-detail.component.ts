import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';
import { TaskService, TaskDetail } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-task-detail',
    imports: [
        CommonModule, RouterModule, MatCardModule, MatChipsModule,
        MatButtonModule, MatIconModule, MatListModule, MatDividerModule,
        MatTabsModule,
    ],
    templateUrl: './task-detail.component.html',
    styleUrl: './task-detail.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskDetailComponent implements OnInit, OnDestroy {
  task: TaskDetail | null = null;
  isManager = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isManager = this.authService.hasRole('manager');
    const id = +this.route.snapshot.params['id'];
    this.taskService.get(id).pipe(takeUntil(this.destroy$)).subscribe((task) => {
      this.task = task;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
