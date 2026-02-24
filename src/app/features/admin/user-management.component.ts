import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-user-management',
    imports: [
        CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
        MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
        MatCardModule, MatChipsModule,
    ],
    templateUrl: './user-management.component.html',
    styleUrl: './user-management.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: any[] = [];
  columns = ['email', 'name', 'role', 'is_active', 'actions'];
  showCreateForm = false;
  newUser = { email: '', first_name: '', last_name: '', role: 'engineer', password: '' };
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.http.get<any>(`${environment.apiUrl}/users/`).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.users = res.results;
      this.cdr.markForCheck();
    });
  }

  createUser(): void {
    this.http.post(`${environment.apiUrl}/users/`, this.newUser).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.showCreateForm = false;
      this.newUser = { email: '', first_name: '', last_name: '', role: 'engineer', password: '' };
      this.loadUsers();
      this.cdr.markForCheck();
    });
  }

  deactivateUser(id: number): void {
    this.http.delete(`${environment.apiUrl}/users/${id}/`).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadUsers();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
