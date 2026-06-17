import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as monaco from 'monaco-editor';
import { CodeExecutionService } from './code-execution.service';

type SupportedLanguage = 'c' | 'cpp' | 'python' | 'java' | 'kotlin';

interface LanguageOption {
    id: SupportedLanguage;
    name: string;
    defaultCode: string;
}

@Component({
    selector: 'app-code-runner',
    imports: [CommonModule, FormsModule],
    templateUrl: './code-runner.html',
    styleUrl: './code-runner.css'
})
export class CodeRunner implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;

    private editor?: monaco.editor.IStandaloneCodeEditor;

    protected readonly selectedLanguage = signal<SupportedLanguage>('c');
    protected readonly code = signal<string>('');
    protected readonly inputData = signal<string>('');
    protected readonly output = signal<string>('');
    protected readonly isLoading = signal<boolean>(false);
    protected readonly executionStats = signal<{ time: number; memory: number } | null>(null);

    protected readonly languages: LanguageOption[] = [
        {
            id: 'c',
            name: 'C',
            defaultCode: `#include <stdio.h>

int main() {
    char name[100];
    scanf("%s", name);
    printf("Hello, %s\\n", name);
    return 0;
}
`
        },
        {
            id: 'cpp',
            name: 'C++',
            defaultCode: `#include <iostream>
#include <string>

int main() {
    std::string name;
    std::cin >> name;
    std::cout << "Hello, " << name << std::endl;
    return 0;
}
`
        },
        {
            id: 'python',
            name: 'Python',
            defaultCode: `name = input()
print(f"Hello, {name}")
`
        },
        {
            id: 'java',
            name: 'Java',
            defaultCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String name = scanner.nextLine();
        System.out.println("Hello, " + name);
    }
}
`
        },
        {
            id: 'kotlin',
            name: 'Kotlin',
            defaultCode: `fun main() {
    val name = readLine()
    println("Hello, $name")
}
`
        }
    ];

    constructor(private codeExecutionService: CodeExecutionService) { }

    ngOnInit(): void {
        // Set Monaco Editor environment
        (window as any).MonacoEnvironment = {
            getWorkerUrl: function (moduleId: string, label: string) {
                if (label === 'json') {
                    return './assets/monaco-editor/esm/vs/language/json/json.worker.js';
                }
                if (label === 'css' || label === 'scss' || label === 'less') {
                    return './assets/monaco-editor/esm/vs/language/css/css.worker.js';
                }
                if (label === 'html' || label === 'handlebars' || label === 'razor') {
                    return './assets/monaco-editor/esm/vs/language/html/html.worker.js';
                }
                if (label === 'typescript' || label === 'javascript') {
                    return './assets/monaco-editor/esm/vs/language/typescript/ts.worker.js';
                }
                return './assets/monaco-editor/esm/vs/editor/editor.worker.js';
            }
        };

        // Set initial code
        this.code.set(this.languages[0].defaultCode);
    }

    ngAfterViewInit(): void {
        this.initializeEditor();
    }

    ngOnDestroy(): void {
        if (this.editor) {
            this.editor.dispose();
        }
    }

    private initializeEditor(): void {
        if (!this.editorContainer) return;

        this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
            value: this.code(),
            language: this.selectedLanguage(),
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            minimap: {
                enabled: true
            },
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false
            },
            parameterHints: {
                enabled: true
            },
            wordBasedSuggestions: 'allDocuments',
            tabSize: 4,
            insertSpaces: true,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            formatOnType: true
        });

        // Listen to content changes
        this.editor.onDidChangeModelContent(() => {
            if (this.editor) {
                this.code.set(this.editor.getValue());
            }
        });
    }

    protected onLanguageChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const newLanguage = select.value as SupportedLanguage;

        this.selectedLanguage.set(newLanguage);

        // Find the default code for the selected language
        const languageOption = this.languages.find(lang => lang.id === newLanguage);
        if (languageOption) {
            this.code.set(languageOption.defaultCode);

            // Update editor language and content
            if (this.editor) {
                const model = this.editor.getModel();
                if (model) {
                    monaco.editor.setModelLanguage(model, newLanguage);
                    this.editor.setValue(languageOption.defaultCode);
                }
            }
        }
    }

    protected async runCode(): Promise<void> {
        this.isLoading.set(true);
        this.output.set('');
        this.executionStats.set(null);

        try {
            const response = await this.codeExecutionService.executeCode({
                code: this.code(),
                input: this.inputData(),
                language: this.selectedLanguage()
            }).toPromise();

            if (response) {
                if (response.status === 'OK') {
                    this.output.set(response.output || '(No output)');
                    this.executionStats.set({
                        time: response.time,
                        memory: response.memory
                    });
                } else {
                    // Handle errors
                    let errorMessage = `Status: ${response.status}\n`;
                    if (response.error) {
                        errorMessage += response.error;
                    } else {
                        errorMessage += response.output || 'Unknown error occurred';
                    }
                    this.output.set(errorMessage);
                }
            }
        } catch (error: any) {
            let errorMsg = error.error?.message || error.error || error.message || 'Failed to connect to the server';
            if (typeof errorMsg === 'object') {
                errorMsg = JSON.stringify(errorMsg);
            }
            this.output.set(`Error: ${errorMsg}`);
        } finally {
            this.isLoading.set(false);
        }
    }

    protected clearCode(): void {
        const languageOption = this.languages.find(lang => lang.id === this.selectedLanguage());
        if (languageOption && this.editor) {
            this.editor.setValue(languageOption.defaultCode);
        }
    }

    protected clearInput(): void {
        this.inputData.set('');
    }

    protected clearOutput(): void {
        this.output.set('');
        this.executionStats.set(null);
    }
}
