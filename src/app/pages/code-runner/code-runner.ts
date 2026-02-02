import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as monaco from 'monaco-editor';

type SupportedLanguage = 'c' | 'cpp' | 'python' | 'java' | 'kotlin';

interface LanguageOption {
    id: SupportedLanguage;
    name: string;
    defaultCode: string;
}

@Component({
    selector: 'app-code-runner',
    imports: [CommonModule],
    templateUrl: './code-runner.html',
    styleUrl: './code-runner.css'
})
export class CodeRunner implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;

    private editor?: monaco.editor.IStandaloneCodeEditor;

    protected readonly selectedLanguage = signal<SupportedLanguage>('c');
    protected readonly code = signal<string>('');

    protected readonly languages: LanguageOption[] = [
        {
            id: 'c',
            name: 'C',
            defaultCode: `// C Code Runner
#include <stdio.h>
#include <string.h>

void greet(const char* name) {
    printf("Hello, %s! Welcome to Code Runner.\\n", name);
}

int main() {
    greet("Developer");
    return 0;
}
`
        },
        {
            id: 'cpp',
            name: 'C++',
            defaultCode: `// C++ Code Runner
#include <iostream>
#include <string>

std::string greet(const std::string& name) {
    return "Hello, " + name + "! Welcome to Code Runner.";
}

int main() {
    std::string message = greet("Developer");
    std::cout << message << std::endl;
    return 0;
}
`
        },
        {
            id: 'python',
            name: 'Python',
            defaultCode: `# Python Code Runner
def greet(name):
    """Greet someone with a friendly message."""
    return f"Hello, {name}! Welcome to Code Runner."

if __name__ == "__main__":
    message = greet("Developer")
    print(message)
`
        },
        {
            id: 'java',
            name: 'Java',
            defaultCode: `// Java Code Runner
public class Main {
    public static String greet(String name) {
        return "Hello, " + name + "! Welcome to Code Runner.";
    }
    
    public static void main(String[] args) {
        String message = greet("Developer");
        System.out.println(message);
    }
}
`
        },
        {
            id: 'kotlin',
            name: 'Kotlin',
            defaultCode: `// Kotlin Code Runner
fun greet(name: String): String {
    return "Hello, $name! Welcome to Code Runner."
}

fun main() {
    val message = greet("Developer")
    println(message)
}
`
        }
    ];

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

    protected runCode(): void {
        console.log('Running code:', this.code());
        // Placeholder for code execution functionality
        alert('Code execution is not implemented yet. This would send the code to a backend service.');
    }

    protected clearCode(): void {
        const languageOption = this.languages.find(lang => lang.id === this.selectedLanguage());
        if (languageOption && this.editor) {
            this.editor.setValue(languageOption.defaultCode);
        }
    }
}
