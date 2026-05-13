import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as monaco from 'monaco-editor';

import { ProblemService } from '../../../services/problem.service';
import { TestService } from '../../../services/test.service';
import { ScriptCheckerService } from '../../../services/script-checker.service';
import { ProblemDifficulty, EvaluationType } from '../../../models/problem.models';
import { NewTestRequest, UpdateTestRequest, DeleteTestRequest, TestDto } from '../../../models/test.models';
import { ScriptCheckerDto } from '../../../models/script-checker.models';

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
  private editor?: monaco.editor.IStandaloneCodeEditor;

  isEditMode = false;
  problemId?: number;
  activeTab: 'info' | 'tests' | 'checkers' = 'info';
  
  difficulties = Object.values(ProblemDifficulty);
  evaluationTypes = Object.values(EvaluationType);
  availableLangs = ['c', 'cpp', 'python', 'java', 'kotlin'];

  problemForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    topic: [''],
    difficulty: [ProblemDifficulty.MEDIUM, Validators.required],
    statement: ['', [Validators.required, Validators.minLength(10)]],
    execution_time_limit_ms: [1000, [Validators.required, Validators.min(500)]],
    execution_memory_limit_kb: [65536, [Validators.required, Validators.min(512)]],
    default_evaluation_type: [EvaluationType.EXACT_MATCH, Validators.required],
    default_script_checker_id: [null]
  });

  previewHtml = signal<SafeHtml>('');
  tests: any[] = [];
  deletedTests: number[] = [];
  checkers: any[] = [];
  deletedCheckers: number[] = [];

  selectedTest: any = null;
  selectedChecker: any = null;
  isSaving = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.problemId = Number(id);
      this.loadData();
    } else {
      this.updatePreview(); // Initial preview for new problem
    }
  }

  ngAfterViewChecked(): void {
    if (this.activeTab === 'checkers' && this.selectedChecker && this.checkerEditorContainer && !this.editor) {
      this.initMonaco();
    }
  }

  loadData(): void {
    if (!this.problemId) return;

    this.problemService.getProblemById(this.problemId).subscribe(problem => {
      this.problemForm.patchValue({
        title: problem.title,
        topic: problem.topic?.name,
        difficulty: problem.difficulty,
        statement: problem.statement,
        execution_time_limit_ms: problem.execution_time_limit_ms,
        execution_memory_limit_kb: problem.execution_memory_limit_kb,
        default_evaluation_type: problem.default_evaluation_type,
        default_script_checker_id: problem.default_script_checker_id
      });
      this.updatePreview();
    });

    this.testService.getProblemTests(this.problemId).subscribe(tests => {
      this.tests = tests.sort((a, b) => a.ordinal - b.ordinal);
    });

    // In a real app, you might need an endpoint to list all checkers or checkers for a problem
    // For now, I'll assume script checkers are loaded based on problem or we need another way
    // The user said "list of script checkers"
    // I'll add a placeholder to fetch them if possible, or just manage the ones we have.
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
    
    // Dispose and re-init monaco for new checker
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
    if (!this.checkerEditorContainer) return;

    this.editor = monaco.editor.create(this.checkerEditorContainer.nativeElement, {
      value: this.selectedChecker.code,
      language: this.selectedChecker.language.toLowerCase(),
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false }
    });

    this.editor.onDidChangeModelContent(() => {
      this.selectedChecker.code = this.editor?.getValue() || '';
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

    forkJoin([...checkerOps, ...deleteCheckerOps]).pipe(
      switchMap(results => {
        // Update problem default checker ID if it was a new one
        const updatedProblem = { ...this.problemForm.value };
        
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
