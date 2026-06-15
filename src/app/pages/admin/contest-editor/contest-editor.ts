import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ContestService } from '../../../services/contest.service';
import { ProblemService } from '../../../services/problem.service';
import { CreateContestRequest, ContestProblemDto } from '../../../models/contest.models';
import { ProblemDto } from '../../../models/problem.models';

import { ProblemPickerModal } from '../../../components/problem-picker-modal/problem-picker-modal';

// Local interface to hold a problem row with its resolved name
export interface ContestProblemRow {
  problem_id: number;
  title: string;
  ordinal: number;
}

@Component({
  selector: 'app-admin-contest-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ProblemPickerModal],
  templateUrl: './contest-editor.html',
  styleUrl: './contest-editor.css'
})
export class AdminContestEditor implements OnInit {
  private fb = inject(FormBuilder);
  private contestService = inject(ContestService);
  private problemService = inject(ProblemService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = false;
  contestId?: number;

  contestForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    overview: [''],
    rules: [''],
    startDate: ['', Validators.required],
    startTime: ['', Validators.required],
    freezeDate: [''],
    freezeTime: [''],
    endDate: ['', Validators.required],
    endTime: ['', Validators.required]
  });

  isSaving = signal(false);
  isSavingProblems = signal(false);

  // The ordered list of problems in this contest (with names)
  problemRows = signal<ContestProblemRow[]>([]);

  // Modal visibility
  isPickerModalVisible = false;

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.contestId = Number(id);
      this.loadData();
    }
  }

  loadData(): void {
    if (!this.contestId) return;

    this.contestService.getContestById(this.contestId).subscribe(contest => {
      const splitDateTime = (dateStr: string | null) => {
        if (!dateStr) return { date: '', time: '' };
        const d = new Date(dateStr);
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
        return {
          date: iso.slice(0, 10),
          time: iso.slice(11, 16)
        };
      };

      const start = splitDateTime(contest.start_time);
      const freeze = splitDateTime(contest.freeze_time);
      const end = splitDateTime(contest.end_time);

      this.contestForm.patchValue({
        name: contest.name,
        overview: contest.overview,
        rules: contest.rules,
        startDate: start.date,
        startTime: start.time,
        freezeDate: freeze.date,
        freezeTime: freeze.time,
        endDate: end.date,
        endTime: end.time
      });

      if (!this.isEditMode) {
        // Only disable form fields if we were NOT in edit mode to begin with? 
        // Wait, if we are in edit mode, we want to edit them!
        // So let's NOT disable them here anymore.
      }
    });

    this.loadContestProblems();
  }

  /** Load existing contest problems and resolve their names */
  loadContestProblems(): void {
    if (!this.contestId) return;

    this.contestService.getContestProblems(this.contestId).subscribe(contestProblems => {
      if (contestProblems.length === 0) {
        this.problemRows.set([]);
        return;
      }

      const sorted = contestProblems.sort((a, b) => a.ordinal - b.ordinal);

      // Resolve each problem's title by fetching it individually
      const requests = sorted.map(cp =>
        this.problemService.getProblemById<ProblemDto>(cp.problem_id).pipe(
          map(p => ({
            problem_id: cp.problem_id,
            title: p.title,
            ordinal: cp.ordinal
          } as ContestProblemRow)),
          catchError(() => of({
            problem_id: cp.problem_id,
            title: `Problem #${cp.problem_id}`,
            ordinal: cp.ordinal
          } as ContestProblemRow))
        )
      );

      forkJoin(requests).subscribe(rows => {
        this.problemRows.set(rows);
      });
    });
  }

  // ── Contest creation & update ──

  onSave(): void {
    if (this.contestForm.invalid) {
      this.contestForm.markAllAsTouched();
      alert('Please fill out all required fields correctly. Name, Start Time, and End Time are required.');
      return;
    }

    this.isSaving.set(true);
    const formVal = this.contestForm.value;

    const combineDateTime = (date: string, time: string) => {
      if (!date || !time) return null;
      return new Date(`${date}T${time}`).toISOString();
    };

    if (this.isEditMode && this.contestId) {
      // Update existing contest
      const updateRequest: any = {
        name: formVal.name,
        overview: formVal.overview,
        rules: formVal.rules,
        start_time: combineDateTime(formVal.startDate, formVal.startTime),
        freeze_time: combineDateTime(formVal.freezeDate, formVal.freezeTime),
        end_time: combineDateTime(formVal.endDate, formVal.endTime)
      };

      this.contestService.updateContest(this.contestId, updateRequest).subscribe({
        next: () => {
          this.isSaving.set(false);
          alert('Contest updated successfully.');
        },
        error: (err) => {
          this.isSaving.set(false);
          alert('Error updating contest: ' + (err.error?.message || 'Unknown error'));
        }
      });
    } else {
      // Create new contest
      const request: CreateContestRequest = {
        name: formVal.name,
        overview: formVal.overview,
        rules: formVal.rules,
        start_time: combineDateTime(formVal.startDate, formVal.startTime)!,
        freeze_time: combineDateTime(formVal.freezeDate, formVal.freezeTime),
        end_time: combineDateTime(formVal.endDate, formVal.endTime)!
      };

      this.contestService.createContest(request).subscribe({
        next: (contest) => {
          this.isSaving.set(false);
          this.router.navigate(['/admin/contests', contest.id]);
        },
        error: (err) => {
          this.isSaving.set(false);
          alert('Error saving contest: ' + (err.error?.message || 'Unknown error'));
        }
      });
    }
  }

  // ── Problem list management ──

  openPickerModal(): void {
    this.isPickerModalVisible = true;
  }

  closePickerModal(): void {
    this.isPickerModalVisible = false;
  }

  onProblemSelected(prob: ProblemDto): void {
    const current = this.problemRows();

    if (current.some(r => r.problem_id === prob.id)) {
      alert('This problem is already in the contest.');
      return;
    }

    const newRow: ContestProblemRow = {
      problem_id: prob.id,
      title: prob.title,
      ordinal: current.length + 1
    };

    this.problemRows.set([...current, newRow]);
    this.closePickerModal();
  }

  moveProblemUp(index: number): void {
    if (index === 0) return;
    const rows = [...this.problemRows()];
    [rows[index - 1], rows[index]] = [rows[index], rows[index - 1]];
    this.recalcOrdinals(rows);
  }

  moveProblemDown(index: number): void {
    const rows = [...this.problemRows()];
    if (index >= rows.length - 1) return;
    [rows[index], rows[index + 1]] = [rows[index + 1], rows[index]];
    this.recalcOrdinals(rows);
  }

  removeProblem(index: number): void {
    const rows = [...this.problemRows()];
    rows.splice(index, 1);
    this.recalcOrdinals(rows);
  }

  private recalcOrdinals(rows: ContestProblemRow[]): void {
    this.problemRows.set(rows.map((r, i) => ({ ...r, ordinal: i + 1 })));
  }

  /** Persist the current list to the backend */
  saveProblems(): void {
    if (!this.contestId) return;

    this.isSavingProblems.set(true);
    const ids = this.problemRows().map(r => r.problem_id);

    this.contestService.updateContestProblems(this.contestId, { problem_ids: ids }).subscribe({
      next: () => {
        this.isSavingProblems.set(false);
        this.loadContestProblems(); // reload from server to confirm
      },
      error: (err) => {
        console.error('Failed to save problems', err);
        alert('Failed to save problems.');
        this.isSavingProblems.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/contests']);
  }
}
