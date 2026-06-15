import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProblemService } from '../../../services/problem.service';
import { ProblemTopic } from '../../../models/problem.models';

@Component({
  selector: 'app-topics-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topics-list.html',
  styleUrl: './topics-list.css'
})
export class TopicsList implements OnInit {
  private problemService = inject(ProblemService);
  
  topics = signal<ProblemTopic[]>([]);
  isLoading = signal(false);
  
  // Create state
  newTopicName = '';
  isCreating = false;
  
  // Edit state
  editingTopicId: number | null = null;
  editingTopicName = '';

  ngOnInit(): void {
    this.loadTopics();
  }

  loadTopics(): void {
    this.isLoading.set(true);
    this.problemService.getTopics().subscribe({
      next: (data) => {
        this.topics.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load topics', err);
        this.isLoading.set(false);
      }
    });
  }

  startCreate(): void {
    this.isCreating = true;
    this.newTopicName = '';
  }

  cancelCreate(): void {
    this.isCreating = false;
    this.newTopicName = '';
  }

  submitCreate(): void {
    if (!this.newTopicName.trim()) return;
    this.problemService.createTopic(this.newTopicName.trim()).subscribe({
      next: (topic) => {
        this.topics.update(list => [...list, topic]);
        this.cancelCreate();
      },
      error: (err) => alert('Failed to create topic: ' + (err.error?.message || 'Unknown error'))
    });
  }

  startEdit(topic: ProblemTopic): void {
    this.editingTopicId = topic.id!;
    this.editingTopicName = topic.name;
  }

  cancelEdit(): void {
    this.editingTopicId = null;
    this.editingTopicName = '';
  }

  submitEdit(): void {
    if (!this.editingTopicId || !this.editingTopicName.trim()) return;
    this.problemService.updateTopic(this.editingTopicId, this.editingTopicName.trim()).subscribe({
      next: (updated) => {
        this.topics.update(list => list.map(t => t.id === updated.id ? updated : t));
        this.cancelEdit();
      },
      error: (err) => alert('Failed to update topic: ' + (err.error?.message || 'Unknown error'))
    });
  }

  deleteTopic(topic: ProblemTopic): void {
    if (confirm(`Are you sure you want to delete the topic "${topic.name}"? Problems with this topic will have no topic assigned.`)) {
      this.problemService.deleteTopic(topic.id!).subscribe({
        next: () => {
          this.topics.update(list => list.filter(t => t.id !== topic.id));
        },
        error: (err) => alert('Failed to delete topic: ' + (err.error?.message || 'Unknown error'))
      });
    }
  }
}
