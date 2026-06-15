import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { ProblemService } from '../../../services/problem.service';
import { TestService } from '../../../services/test.service';
import { ScriptCheckerService } from '../../../services/script-checker.service';
import { ProblemDifficulty, EvaluationType, ProblemTopic } from '../../../models/problem.models';
import { NewTestRequest, UpdateTestRequest, DeleteTestRequest, TestDto } from '../../../models/test.models';
import { ScriptCheckerDto } from '../../../models/script-checker.models';

// Declare monaco and require as they are loaded via script in index.html
declare const monaco: any;
declare const require: any;

// Configure marked
marked.use(markedKatex({ throwOnError: false, output: 'html' }));

@Component({
  selector: 'app-problem-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './problem-editor.html',
  styleUrl: './problem-editor.css'
})
export class ProblemEditor implements OnInit, AfterViewChecked {
  private fb = inject(FormBuilder);
  private problemService = inject(ProblemService);
  private testService = inject(TestService);
  private checkerService = inject(ScriptCheckerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('checkerEditor') checkerEditorContainer?: ElementRef;
  private editor?: any;

  isEditMode = false;
  problemId?: number;
  private _activeTab: 'info' | 'tests' | 'checkers' = 'info';
  get activeTab() { return this._activeTab; }
  set activeTab(val: 'info' | 'tests' | 'checkers') {
    if (this._activeTab === 'checkers' && val !== 'checkers') {
      if (this.editor) {
        this.editor.dispose();
        this.editor = undefined;
      }
    }
    this._activeTab = val;
  }
  
  difficulties = Object.values(ProblemDifficulty);
  evaluationTypes = Object.values(EvaluationType);
  availableLangs = ['c', 'cpp', 'python', 'java', 'kotlin'];

  problemForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    topic_id: [null],
    difficulty: [ProblemDifficulty.MEDIUM, Validators.required],
    statement: ['', [Validators.required, Validators.minLength(10)]],
    execution_time_limit_ms: [1000, [Validators.required, Validators.min(500)]],
    execution_memory_limit_kb: [65536, [Validators.required, Validators.min(512)]],
    default_evaluation_type: [EvaluationType.EXACT_MATCH, Validators.required],
    default_script_checker_id: [null],
    is_public: [true]
  });

  previewHtml = signal<SafeHtml>('');
  topics: ProblemTopic[] = [];
  tests: any[] = [];
  deletedTests: number[] = [];
  checkers: any[] = [];
  deletedCheckers: number[] = [];

  selectedTest: any = null;
  selectedChecker: any = null;
  isSaving = signal(false);

  ngOnInit(): void {
    this.problemService.getTopics().subscribe(topics => {
      this.topics = topics;
    });

    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.problemId = Number(id);
      this.loadData();
    } else {
      this.updatePreview(); // Initial preview for new problem
    }
  }

  private isEditorInitializing = false;

  ngAfterViewChecked(): void {
    if (this.activeTab === 'checkers' && this.selectedChecker && this.checkerEditorContainer && !this.editor && !this.isEditorInitializing) {
      this.isEditorInitializing = true;
      // Ensure monaco is loaded via AMD require before initializing
      if (typeof monaco === 'undefined') {
        require(['vs/editor/editor.main'], () => {
          this.initMonaco();
          this.isEditorInitializing = false;
        });
      } else {
        this.initMonaco();
        this.isEditorInitializing = false;
      }
    }
  }

  loadData(): void {
    if (!this.problemId) return;

    this.problemService.getProblemById(this.problemId).subscribe(problem => {
      this.problemForm.patchValue({
        title: problem.title,
        topic_id: problem.topic?.id ?? null,
        difficulty: problem.difficulty,
        statement: problem.statement,
        execution_time_limit_ms: problem.execution_time_limit_ms,
        execution_memory_limit_kb: problem.execution_memory_limit_kb,
        default_evaluation_type: problem.default_evaluation_type,
        default_script_checker_id: problem.default_script_checker_id,
        is_public: problem.is_public !== undefined ? problem.is_public : true
      });
      this.updatePreview();

      this.testService.getProblemTests(this.problemId!).subscribe(tests => {
        this.tests = tests.sort((a, b) => a.ordinal - b.ordinal);

        const checkerIds = new Set<number>();
        if (problem.default_script_checker_id) {
          checkerIds.add(problem.default_script_checker_id);
        }
        for (const t of tests) {
          if (t.override_script_checker_id) {
            checkerIds.add(t.override_script_checker_id);
          }
        }

        if (checkerIds.size > 0) {
          const obs = Array.from(checkerIds).map(id => this.checkerService.getScriptChecker(id));
          forkJoin(obs).subscribe(checkersData => {
            this.checkers = checkersData.map(checker => ({
              id: checker.id,
              name: checker.name,
              language: typeof checker.language === 'string' ? checker.language : (checker.language as any)?.language ?? 'python',
              code: checker.code
            }));
            
            // Ensure the dropdown reflects the loaded checker
            if (problem.default_script_checker_id) {
              this.problemForm.patchValue({ default_script_checker_id: problem.default_script_checker_id });
            }
          });
        }
      });
    });
  }

  updatePreview(): void {
    const md = this.problemForm.get('statement')?.value || '';
    const result = marked.parse(md);
    
    if (result instanceof Promise) {
      result.then(html => {
        this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
      });
    } else {
      this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(result));
    }
  }

  // --- TESTS LOGIC ---
  addTest(): void {
    const newTest = {
      tempId: Date.now(),
      ordinal: this.tests.length + 1,
      is_example: false,
      input_data: '',
      expected_output: '',
      override_evaluation_type: null,
      override_script_checker_id: null
    };
    this.tests.push(newTest);
    this.selectTest(newTest);
  }

  selectTest(test: any): void {
    this.selectedTest = test;
  }

  moveTest(index: number, direction: number): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.tests.length) return;
    
    const temp = this.tests[index];
    this.tests[index] = this.tests[newIndex];
    this.tests[newIndex] = temp;
    
    // Update ordinals
    this.tests.forEach((t, i) => t.ordinal = i + 1);
  }

  deleteTest(index: number): void {
    const test = this.tests[index];
    if (test.id) {
      this.deletedTests.push(test.id);
    }
    this.tests.splice(index, 1);
    if (this.selectedTest === test) this.selectedTest = null;
    
    // Update ordinals
    this.tests.forEach((t, i) => t.ordinal = i + 1);
  }

  // --- CHECKERS LOGIC ---
  addChecker(): void {
    const newChecker = {
      tempId: Date.now(),
      name: 'New Checker',
      language: 'python',
      code: '# Write your checker logic here\n'
    };
    this.checkers.push(newChecker);
    this.selectChecker(newChecker);
  }

  selectChecker(checker: any): void {
    if (this.selectedChecker === checker) return;
    
    // Save current editor code to previous checker
    if (this.selectedChecker && this.editor) {
      this.selectedChecker.code = this.editor.getValue();
    }

    this.selectedChecker = checker;
    
    // Dispose old editor
    if (this.editor) {
      this.editor.dispose();
      this.editor = undefined;
    }
  }

  deleteChecker(index: number): void {
    const checker = this.checkers[index];
    if (checker.id) {
      this.deletedCheckers.push(checker.id);
    }
    this.checkers.splice(index, 1);
    if (this.selectedChecker === checker) {
      this.selectedChecker = null;
      if (this.editor) {
        this.editor.dispose();
        this.editor = undefined;
      }
    }
  }

  initMonaco(): void {
    if (!this.checkerEditorContainer || !this.selectedChecker) return;
    
    const container = this.checkerEditorContainer.nativeElement;
    
    // Safety check: if Monaco has already attached a 'data-mimic' or other attributes
    // it can cause conflicts if we don't dispose the previous view properly.
    if (container.childElementCount > 0 && !this.editor) {
      container.innerHTML = '';
    }

    if (this.editor) return;

    this.editor = monaco.editor.create(container, {
      value: this.selectedChecker.code || '',
      language: (this.selectedChecker.language || 'python').toLowerCase(),
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false }
    });

    this.editor.onDidChangeModelContent(() => {
      if (this.selectedChecker) {
        this.selectedChecker.code = this.editor?.getValue() || '';
      }
    });
  }

  // --- SAVE LOGIC ---
  onSave(): void {
    if (this.problemForm.invalid) {
      this.problemForm.markAllAsTouched();
      this.activeTab = 'info';
      return;
    }

    // Capture current editor code
    if (this.selectedChecker && this.editor) {
      this.selectedChecker.code = this.editor.getValue();
    }

    this.isSaving.set(true);

    // 1. Save Script Checkers
    const checkerOps = this.checkers.map(c => {
      if (c.id) {
        return this.checkerService.updateScriptChecker(c.id, { name: c.name, language: c.language, code: c.code });
      } else {
        return this.checkerService.createScriptChecker({ name: c.name, language: c.language, code: c.code });
      }
    });

    // Delete checkers
    const deleteCheckerOps = this.deletedCheckers.map(id => this.checkerService.deleteScriptChecker(id));

    const allOps = [...checkerOps, ...deleteCheckerOps];
    const ops$ = allOps.length > 0 ? forkJoin(allOps) : of([]);

    ops$.pipe(
      switchMap(results => {
        // Backfill IDs into this.checkers from create/update results
        const checkerResults = (results as any[]).slice(0, checkerOps.length);
        checkerResults.forEach((res, i) => {
          if (res?.id) {
            this.checkers[i].id = res.id;
          }
        });

        // Build clean problem payload
        const formVal = this.problemForm.value;
        let defaultCheckerId: number | null = null;

        const formCheckerId = formVal.default_script_checker_id;
        if (formCheckerId !== null && formCheckerId !== undefined) {
          defaultCheckerId = Number(formCheckerId);
        } else if (formVal.default_evaluation_type === EvaluationType.SCRIPT_CHECK && this.checkers.length > 0) {
          defaultCheckerId = this.checkers[0].id ?? null;
        }

        const updatedProblem = {
          ...formVal,
          topic_id: formVal.topic_id || null,
          default_script_checker_id: defaultCheckerId
        };

        // 2. Patch/Create Problem
        if (this.isEditMode) {
          return this.problemService.updateProblem(this.problemId!, updatedProblem);
        } else {
          return this.problemService.createProblem(updatedProblem);
        }
      }),
      switchMap(problem => {
        this.problemId = problem.id;
        this.isEditMode = true;

        // 3. Save Tests
        const newTests: NewTestRequest[] = this.tests.filter(t => !t.id).map(t => ({
          ordinal: t.ordinal,
          is_example: t.is_example,
          input_data: t.input_data,
          expected_output: t.expected_output,
          override_evaluation_type: t.override_evaluation_type,
          override_script_checker_id: t.override_script_checker_id
        }));

        const updateTests: UpdateTestRequest[] = this.tests.filter(t => t.id).map(t => ({
          id: t.id,
          ordinal: t.ordinal,
          is_example: t.is_example,
          input_data: t.input_data,
          expected_output: t.expected_output,
          override_evaluation_type: t.override_evaluation_type,
          override_script_checker_id: t.override_script_checker_id
        }));

        const deleteTests: DeleteTestRequest[] = this.deletedTests.map(id => ({ id }));

        if (updateTests.length > 0) {
          const tempUpdateTests = updateTests.map(t => ({ id: t.id, ordinal: t.ordinal! + 10000 }));
          return this.testService.updateTestList(this.problemId!, {
            new_tests: [],
            update_tests: tempUpdateTests,
            delete_tests: []
          }).pipe(
            switchMap(() => this.testService.updateTestList(this.problemId!, {
              new_tests: newTests,
              update_tests: updateTests,
              delete_tests: deleteTests
            }))
          );
        }

        return this.testService.updateTestList(this.problemId!, {
          new_tests: newTests,
          update_tests: updateTests,
          delete_tests: deleteTests
        });
      })
    ).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/admin/problems']);
      },
      error: (err) => {
        this.isSaving.set(false);
        alert('Error saving problem: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/problems']);
  }
}
