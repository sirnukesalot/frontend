import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ClientService } from '../../../../core/services/client.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  clientId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private clientService: ClientService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      client_type: ['company', Validators.required],
      phone: [''], email: [''], contact_person: [''],
    });
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true; this.clientId = +id;
      this.clientService.get(this.clientId).pipe(takeUntil(this.destroy$)).subscribe((c) => {
        this.form.patchValue(c);
        this.cdr.markForCheck();
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;

    this.router.navigate(['/clients']);

    if (this.isEdit && this.clientId) {
      this.clientService.update(this.clientId, this.form.value).pipe(takeUntil(this.destroy$)).subscribe();
    } else {
      this.clientService.create(this.form.value).pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  cancel(): void { this.router.navigate(['/clients']); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
