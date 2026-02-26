import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { Organization, OrganizationService } from '../../../../core/services/organization.service';
import { OrganizationFormComponent } from '../organization-form/organization-form.component';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationListComponent implements OnInit, OnDestroy {
  organizations: Organization[] = [];
  displayedColumns = ['name', 'slug', 'is_active', 'user_count', 'task_count', 'created_at'];
  private destroy$ = new Subject<void>();

  constructor(
    private orgService: OrganizationService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadOrganizations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrganizations(): void {
    this.orgService.list().pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.organizations = res.results;
      this.cdr.markForCheck();
    });
  }

  goToDetail(org: Organization): void {
    this.router.navigate(['/platform/organizations', org.id]);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(OrganizationFormComponent, {
      width: '400px',
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.snackBar.open('Organization created', 'OK', { duration: 3000 });
        this.loadOrganizations();
      }
    });
  }
}
