import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Tarea {
  id: number;
  titulo: string;
  prioridad: 'alta' | 'media' | 'baja';
  completada: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="container">
      <header class="header">
        <div>
          <span class="badge">⚡ ZONELESS + SIGNALS (SIN ZONE.JS)</span>
          <h1>Gestor de Tareas Reactivo</h1>
        </div>
        <div class="render-counter">
          <span>Ciclos reactivos:</span>
          <strong>{{ ciclosReactivos() }}</strong>
        </div>
      </header>

      <section class="stats-grid">
        <div class="stat-card"><span>Total</span><strong>{{ totalTareas() }}</strong></div>
        <div class="stat-card"><span>Pendientes</span><strong>{{ pendientes() }}</strong></div>
        <div class="stat-card"><span>Completadas</span><strong>{{ completadas() }}</strong></div>
        <div class="stat-card"><span>Progreso</span><strong>{{ progreso() }}%</strong></div>
      </section>

      <form (ngSubmit)="agregarTarea()" class="form-row">
        <input type="text" [(ngModel)]="nuevoTitulo" name="titulo" placeholder="Escribe una nueva tarea..." required />
        <select [(ngModel)]="nuevaPrioridad" name="prioridad">
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <button type="submit">Agregar</button>
      </form>

      <div class="filters">
        <button [class.active]="filtro() === 'todas'" (click)="filtro.set('todas')">Todas</button>
        <button [class.active]="filtro() === 'pendientes'" (click)="filtro.set('pendientes')">Pendientes</button>
        <button [class.active]="filtro() === 'completadas'" (click)="filtro.set('completadas')">Completadas</button>
      </div>

      <ul class="task-list">
        @for (tarea of tareasFiltradas(); track tarea.id) {
          <li [class.done]="tarea.completada">
            <label>
              <input type="checkbox" [checked]="tarea.completada" (change)="toggleTarea(tarea.id)" />
              <span>{{ tarea.titulo }}</span>
            </label>
            <div class="actions">
              <span class="tag" [attr.data-prio]="tarea.prioridad">{{ tarea.prioridad }}</span>
              <button class="btn-del" (click)="eliminarTarea(tarea.id)">✕</button>
            </div>
          </li>
        } @empty {
          <p class="empty">No hay tareas para mostrar en este filtro.</p>
        }
      </ul>
    </main>
  `,
  styles: [`
    .container { max-width: 680px; margin: 2rem auto; padding: 1.5rem; font-family: system-ui, sans-serif; color: #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; }
    .badge { background: #1e293b; color: #38bdf8; border: 1px solid #0284c7; padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    h1 { margin: 0.4rem 0 0; font-size: 1.6rem; }
    .render-counter { background: #0f172a; border: 1px solid #334155; padding: 0.6rem 1rem; border-radius: 10px; text-align: right; }
    .render-counter span { display: block; font-size: 0.75rem; color: #94a3b8; }
    .render-counter strong { font-size: 1.3rem; color: #34d399; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
    .stat-card { background: #1e293b; padding: 0.9rem; border-radius: 10px; border: 1px solid #334155; }
    .stat-card span { display: block; font-size: 0.8rem; color: #94a3b8; }
    .stat-card strong { font-size: 1.4rem; color: #f8fafc; }
    .form-row { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    input[type="text"], select { background: #0f172a; border: 1px solid #334155; color: #f8fafc; padding: 0.65rem 0.85rem; border-radius: 8px; }
    input[type="text"] { flex: 1; }
    button { background: #0284c7; color: white; border: none; padding: 0.65rem 1.1rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
    button:hover { background: #0369a1; }
    .filters { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .filters button { background: #1e293b; color: #94a3b8; font-size: 0.85rem; padding: 0.45rem 0.9rem; }
    .filters button.active { background: #38bdf8; color: #0f172a; }
    .task-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .task-list li { display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #334155; }
    .task-list li.done span { text-decoration: line-through; color: #64748b; }
    label { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; }
    .actions { display: flex; align-items: center; gap: 0.6rem; }
    .tag { font-size: 0.75rem; padding: 0.2rem 0.55rem; border-radius: 6px; text-transform: uppercase; font-weight: 700; }
    .tag[data-prio="alta"] { background: #7f1d1d; color: #fca5a5; }
    .tag[data-prio="media"] { background: #78350f; color: #fde68a; }
    .tag[data-prio="baja"] { background: #14532d; color: #86efac; }
    .btn-del { background: transparent; color: #f87171; padding: 0.25rem 0.5rem; }
    .btn-del:hover { background: #7f1d1d; }
    .empty { text-align: center; color: #64748b; padding: 1.5rem; }
  `]
})
export class AppComponent {
  tareas = signal<Tarea[]>([
    { id: 1, titulo: 'Configurar proyecto Angular sin Zone.js', prioridad: 'alta', completada: true },
    { id: 2, titulo: 'Implementar señales reactivas con computed()', prioridad: 'media', completada: false },
    { id: 3, titulo: 'Probar rendimiento en navegador', prioridad: 'baja', completada: false }
  ]);

  filtro = signal<'todas' | 'pendientes' | 'completadas'>('todas');
  ciclosReactivos = signal(0);
  nuevoTitulo = '';
  nuevaPrioridad: 'alta' | 'media' | 'baja' = 'media';

  totalTareas = computed(() => this.tareas().length);
  completadas = computed(() => this.tareas().filter(t => t.completada).length);
  pendientes = computed(() => this.totalTareas() - this.completadas());
  progreso = computed(() => this.totalTareas() === 0 ? 0 : Math.round((this.completadas() / this.totalTareas()) * 100));

  tareasFiltradas = computed(() => {
    const f = this.filtro();
    const lista = this.tareas();
    if (f === 'pendientes') return lista.filter(t => !t.completada);
    if (f === 'completadas') return lista.filter(t => t.completada);
    return lista;
  });

  constructor() {
    effect(() => {
      this.tareas();
      this.ciclosReactivos.update(c => c + 1);
    }, { allowSignalWrites: true });
  }

  agregarTarea(): void {
    const titulo = this.nuevoTitulo.trim();
    if (!titulo) return;
    this.tareas.update(lista => [{ id: Date.now(), titulo, prioridad: this.nuevaPrioridad, completada: false }, ...lista]);
    this.nuevoTitulo = '';
  }

  toggleTarea(id: number): void {
    this.tareas.update(lista => lista.map(t => (t.id === id ? { ...t, completada: !t.completada } : t)));
  }

  eliminarTarea(id: number): void {
    this.tareas.update(lista => lista.filter(t => t.id !== id));
  }
}
