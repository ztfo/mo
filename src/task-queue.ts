import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority?: number;
  estimate?: number;
  featureContext?: string;
  createdAt: string;
  updatedAt: string;
  selected?: boolean;
}

type TaskChangeListener = (tasks: Task[]) => void;

export class TaskQueue {
  private static instance: TaskQueue;
  private tasks: Task[] = [];
  private listeners: TaskChangeListener[] = [];
  private storageFile: string;

  private constructor() {
    this.storageFile = path.join(os.homedir(), '.mo-task-queue.json');
    this.loadFromDisk();
  }

  public static getInstance(): TaskQueue {
    if (!TaskQueue.instance) {
      TaskQueue.instance = new TaskQueue();
    }
    return TaskQueue.instance;
  }

  // Task Management Methods
  public addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.push(newTask);
    this.notifyListeners();
    this.saveToDisk();
    return newTask;
  }

  public addTasks(tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]): Task[] {
    const newTasks = tasks.map(task => ({
      ...task,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    this.tasks.push(...newTasks);
    this.notifyListeners();
    this.saveToDisk();
    return newTasks;
  }

  public updateTask(id: string, updates: Partial<Task>): Task | null {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return null;

    const updatedTask = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.tasks[taskIndex] = updatedTask;
    this.notifyListeners();
    this.saveToDisk();
    return updatedTask;
  }

  public removeTask(id: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.tasks.length !== initialLength) {
      this.notifyListeners();
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public removeTasks(ids: string[]): number {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(t => !ids.includes(t.id));
    const removedCount = initialLength - this.tasks.length;
    if (removedCount > 0) {
      this.notifyListeners();
      this.saveToDisk();
    }
    return removedCount;
  }

  public clearTasks(): void {
    if (this.tasks.length > 0) {
      this.tasks = [];
      this.notifyListeners();
      this.saveToDisk();
    }
  }

  // Task Retrieval Methods
  public getAllTasks(): Task[] {
    return [...this.tasks];
  }

  public getTask(id: string): Task | null {
    return this.tasks.find(t => t.id === id) || null;
  }

  public getSelectedTasks(): Task[] {
    return this.tasks.filter(t => t.selected);
  }

  // Task Selection Methods
  public selectTask(id: string, selected: boolean = true): void {
    const task = this.tasks.find(t => t.id === id);
    if (task && task.selected !== selected) {
      task.selected = selected;
      this.notifyListeners();
      this.saveToDisk();
    }
  }

  public selectTasks(ids: string[], selected: boolean = true): void {
    let changed = false;
    this.tasks.forEach(task => {
      if (ids.includes(task.id) && task.selected !== selected) {
        task.selected = selected;
        changed = true;
      }
    });
    if (changed) {
      this.notifyListeners();
      this.saveToDisk();
    }
  }

  public selectAll(selected: boolean = true): void {
    let changed = false;
    this.tasks.forEach(task => {
      if (task.selected !== selected) {
        task.selected = selected;
        changed = true;
      }
    });
    if (changed) {
      this.notifyListeners();
      this.saveToDisk();
    }
  }

  // Task Ordering Methods
  public reorderTask(id: string, newIndex: number): boolean {
    const oldIndex = this.tasks.findIndex(t => t.id === id);
    if (oldIndex === -1 || newIndex < 0 || newIndex >= this.tasks.length) {
      return false;
    }

    const [task] = this.tasks.splice(oldIndex, 1);
    this.tasks.splice(newIndex, 0, task);
    this.notifyListeners();
    this.saveToDisk();
    return true;
  }

  // Task Filtering and Sorting
  public filterTasks(predicate: (task: Task) => boolean): Task[] {
    return this.tasks.filter(predicate);
  }

  public sortTasks(key: keyof Task, ascending: boolean = true): void {
    this.tasks.sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return ascending ? 1 : -1;
      if (bValue === undefined) return ascending ? -1 : 1;

      // Compare values
      if (aValue < bValue) return ascending ? -1 : 1;
      if (aValue > bValue) return ascending ? 1 : -1;
      return 0;
    });
    this.notifyListeners();
    this.saveToDisk();
  }

  // Event Handling
  public addChangeListener(listener: TaskChangeListener): void {
    this.listeners.push(listener);
  }

  public removeChangeListener(listener: TaskChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Storage Methods
  private saveToDisk(): void {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(this.tasks, null, 2));
    } catch (error) {
      console.error('Failed to save task queue:', error);
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf8');
        this.tasks = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load task queue:', error);
      this.tasks = [];
    }
  }

  // Helper Methods
  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(): void {
    const tasks = this.getAllTasks();
    this.listeners.forEach(listener => listener(tasks));
  }

  public getTaskById(id: string): Task | undefined {
    return this.tasks.find(task => task.id === id);
  }
} 