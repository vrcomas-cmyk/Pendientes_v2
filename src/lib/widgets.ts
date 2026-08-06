/** Tipos del sistema de widgets flotantes (Fase 6). Deliberadamente separado de `src/types.ts`
    (que modela las entidades de dominio) porque un widget es posición/tamaño de UI, no un dato
    del usuario que se sincroniza — ver AUDITORIA.md §9 (riesgo "widgets pisan el Context único"). */
export type WidgetTipo = 'pomodoro' | 'kanban' | 'nota-rapida' | 'proxima-tarea'

export interface WidgetInstancia {
  id: string
  tipo: WidgetTipo
  x: number
  y: number
  w: number
  h: number
  colapsado: boolean
}

export const WIDGET_DEFAULTS: Record<WidgetTipo, { titulo: string; w: number; h: number; wMin: number; hMin: number }> = {
  pomodoro: { titulo: 'Pomodoro', w: 220, h: 260, wMin: 180, hMin: 200 },
  kanban: { titulo: 'Kanban rápido', w: 420, h: 320, wMin: 280, hMin: 200 },
  'nota-rapida': { titulo: 'Nota rápida', w: 260, h: 220, wMin: 200, hMin: 160 },
  'proxima-tarea': { titulo: 'Próxima tarea', w: 260, h: 160, wMin: 200, hMin: 130 },
}
