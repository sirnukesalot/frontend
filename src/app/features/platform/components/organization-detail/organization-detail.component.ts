import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';
import {
  ManagerBrief,
  OrganizationDetail,
  OrganizationService,
} from '../../../../core/services/organization.service';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './organization-detail.component.html',
  styleUrl: './organization-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationDetailComponent implements OnInit, OnDestroy {
  org: OrganizationDetail | null = null;
  managers: ManagerBrief[] = [];
  managerColumns = ['email', 'name', 'is_active', 'date_joined'];
  managerForm: FormGroup;
  creating = false;
  managerError = '';
  private orgId!: number;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private orgService: OrganizationService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {
    this.managerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    this.orgId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrg();
    this.loadManagers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrg(): void {
    this.orgService.get(this.orgId).pipe(takeUntil(this.destroy$)).subscribe((org) => {
      this.org = org;
      this.cdr.markForCheck();
    });
  }

  loadManagers(): void {
    this.orgService.listManagers(this.orgId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.managers = res.results;
      this.cdr.markForCheck();
    });
  }

  toggleActive(): void {
    if (!this.org) return;
    this.orgService.update(this.orgId, { is_active: !this.org.is_active }).pipe(takeUntil(this.destroy$)).subscribe((org) => {
      this.org = org;
      this.snackBar.open(
        org.is_active ? 'Organization reactivated' : 'Organization deactivated',
        'OK',
        { duration: 3000 },
      );
      this.cdr.markForCheck();
    });
  }

  createManager(): void {
    if (this.managerForm.invalid) return;
    this.creating = true;
    this.managerError = '';

    this.orgService.createManager(this.orgId, this.managerForm.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open('Manager created', 'OK', { duration: 3000 });
        this.managerForm.reset();
        this.loadManagers();
        this.loadOrg();
        this.creating = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.creating = false;
        this.managerError = err.error?.email?.[0] || err.error?.detail || 'Failed to create manager.';
        this.cdr.markForCheck();
      },
    });
  }
}
