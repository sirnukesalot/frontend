import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';
import { OrganizationService } from '../../../../core/services/organization.service';

@Component({
    selector: 'app-organization-form',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
    ],
    templateUrl: './organization-form.component.html',
    styleUrl: './organization-form.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationFormComponent implements OnDestroy {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private orgService: OrganizationService,
    private dialogRef: MatDialogRef<OrganizationFormComponent>,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    this.orgService.create(this.form.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: (org) => {
        this.dialogRef.close(org);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.name?.[0] || err.error?.detail || 'Failed to create organization.';
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
