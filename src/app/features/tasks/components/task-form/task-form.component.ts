import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TaskService, TaskCreatePayload } from '../../../../core/services/task.service';
import { ClientService, Client } from '../../../../core/services/client.service';
import { TagService, Tag } from '../../../../core/services/tag.service';

@Component({
    selector: 'app-task-form',
    imports: [
        CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
        MatSelectModule, MatDatepickerModule, MatNativeDateModule,
        MatButtonModule, MatChipsModule, MatIconModule, MatCardModule,
    ],
    templateUrl: './task-form.component.html',
    styleUrl: './task-form.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskFormComponent implements OnInit, OnDestroy {
  taskForm!: FormGroup;
  isEdit = false;
  saving = false;
  taskId: number | null = null;
  clients: Client[] = [];
  tags: Tag[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private clientService: ClientService,
    private tagService: TagService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      priority: ['medium', Validators.required],
      deadline: ['', Validators.required],
      client_id: [null],
      tag_ids: [[]],
    });

    this.clientService.list({ page_size: 100 } as any).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.clients = res.results;
      this.cdr.markForCheck();
    });
    this.tagService.list().pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.tags = res.results;
      this.cdr.markForCheck();
    });

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.taskId = +id;
      this.taskService.get(this.taskId).pipe(takeUntil(this.destroy$)).subscribe((task) => {
        this.taskForm.patchValue({
          title: task.title,
          description: task.description,
          priority: task.priority,
          deadline: new Date(task.deadline),
          client_id: task.client?.id || null,
          tag_ids: task.tags.map((t) => t.id),
        });
        this.cdr.markForCheck();
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.invalid || this.saving) return;
    this.saving = true;
    const val = this.taskForm.value;
    const payload: TaskCreatePayload = {
      ...val,
      deadline: new Date(val.deadline).toISOString(),
    };

    this.router.navigate(['/tasks']);

    if (this.isEdit && this.taskId) {
      this.taskService.update(this.taskId, payload).pipe(takeUntil(this.destroy$)).subscribe();
    } else {
      this.taskService.create(payload).pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  cancel(): void {
    this.router.navigate(['/tasks']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
