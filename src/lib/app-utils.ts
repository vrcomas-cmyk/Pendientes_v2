import { toast } from 'sonner'
import { ESPACIO_GENERAL_ID } from '@/types'
import type { Pendiente, Prioridad, Subtarea } from '@/types'

export function uid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + '-' + Math.random().toString(16).slice(2)
}

export function hoyISO(): string {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

/** `idCompletado`: id de la columna del Kanban marcada `esCompletado` (`useApp().columnas`) — con
    columnas moldeables ya no es el literal fijo `'completado'`. Se mantiene ese valor por defecto
    para no romper llamadas que todavía no lo pasan explícitamente. */
export function vencido(p: Pendiente, idCompletado: string = 'completado'): boolean {
  return !!p.fechaLimite && p.estado !== idCompletado && p.fechaLimite < hoyISO()
}

/** Fase 9.1 (estadísticas): cuenta de pendientes completados por día ISO, para el heatmap y las
    métricas derivadas de abajo. Un pendiente reabierto pierde su `fechaCompletado` (lo pone en
    `null` `toggleCompletar`), así que filtrar por ese campo ya excluye reaperturas sin depender
    de `idCompletado`. */
export function actividadPorDia(pendientes: Pendiente[]): Record<string, number> {
  const mapa: Record<string, number> = {}
  pendientes.forEach(p => {
    if (!p.fechaCompletado) return
    const dia = p.fechaCompletado.slice(0, 10)
    mapa[dia] = (mapa[dia] || 0) + 1
  })
  return mapa
}

/** Racha de días consecutivos con al menos una actividad, terminando hoy — o ayer si hoy todavía
    no tiene nada (no queremos que la racha se vea "rota" a las 9am si aún no completaste algo). */
export function rachaDiaria(actividad: Record<string, number>): number {
  let cursor = hoyISO()
  if (!actividad[cursor]) cursor = isoSumarDias(cursor, -1)
  let racha = 0
  while (actividad[cursor]) {
    racha++
    cursor = isoSumarDias(cursor, -1)
  }
  return racha
}

/** Mediana de días entre `creado` y `fechaCompletado` — más robusta que el promedio ante
    outliers (un pendiente olvidado 200 días no debería inflar "cuánto tarda normalmente"). */
export function medianaTiempoVida(pendientes: Pendiente[]): number | null {
  const dias = pendientes
    .filter(p => p.fechaCompletado)
    .map(p => (new Date(p.fechaCompletado!).getTime() - new Date(p.creado).getTime()) / 86400000)
    .filter(d => d >= 0)
    .sort((a, b) => a - b)
  if (!dias.length) return null
  const mid = Math.floor(dias.length / 2)
  return dias.length % 2 ? dias[mid] : (dias[mid - 1] + dias[mid]) / 2
}

/** Completados en los últimos 7 días (incluyendo hoy). */
export function throughputSemanal(actividad: Record<string, number>): number {
  let total = 0
  for (let i = 0; i < 7; i++) total += actividad[isoSumarDias(hoyISO(), -i)] || 0
  return total
}

/** ¿Sigue bloqueado? (Fase 8.5, dependencias): `true` si alguno de sus `bloqueadoPor` referencia
    un pendiente que todavía no está completado. Un id que ya no existe (se borró) no cuenta como
    bloqueador — no tiene sentido dejar algo bloqueado para siempre por un dato huérfano. */
export function estaBloqueado(p: Pendiente, todos: Pendiente[], idCompletado: string = 'completado'): boolean {
  if (!p.bloqueadoPor?.length) return false
  return p.bloqueadoPor.some(id => {
    const b = todos.find(x => x.id === id)
    return !!b && b.estado !== idCompletado
  })
}

/** Progreso de subtareas, incluidas las anidadas (`Subtarea.children`, Fase 8.4) recursivamente:
    una subtarea con hijos cuenta como 1 + el total de sus hijos, igual para las completadas. */
export function progresoSub(p: Pendiente): { hechas: number; total: number; pct: number } | null {
  if (!p.subtareas?.length) return null
  const contar = (arr: Subtarea[]): { hechas: number; total: number } =>
    arr.reduce((acc, s) => {
      const hijos = contar(s.children || [])
      return { hechas: acc.hechas + (s.completada ? 1 : 0) + hijos.hechas, total: acc.total + 1 + hijos.total }
    }, { hechas: 0, total: 0 })
  const { hechas, total } = contar(p.subtareas)
  return { hechas, total, pct: Math.round((hechas / total) * 100) }
}

const DIAS_SEMANA: Record<string, number> = { domingo: 0, lunes: 1, martes: 2, 'miércoles': 3, miercoles: 3, jueves: 4, viernes: 5, 'sábado': 6, sabado: 6 }

function fechaRelativa(dias: number): string {
  const d = new Date(); d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Extrae una fecha de un texto: `>mañana`, `>viernes`, `>+5d`, `>2w`, `>2026-06-20`, o `hoy`/`mañana` sueltos */
function extraerFecha(text: string): { fecha?: string; resto: string } {
  let resto = text
  let fecha: string | undefined
  const aplicar = (tok: string): string | undefined => {
    tok = tok.toLowerCase()
    if (/^\d{4}-\d{2}-\d{2}$/.test(tok)) return tok
    if (tok === 'hoy') return fechaRelativa(0)
    if (tok === 'mañana' || tok === 'manana') return fechaRelativa(1)
    if (tok === 'pasado') return fechaRelativa(2)
    let m = tok.match(/^\+?(\d+)d$/); if (m) return fechaRelativa(+m[1])
    m = tok.match(/^\+?(\d+)[ws]$/); if (m) return fechaRelativa(+m[1] * 7)
    if (tok in DIAS_SEMANA) { const d = new Date(); const diff = (DIAS_SEMANA[tok] - d.getDay() + 7) % 7 || 7; return fechaRelativa(diff) }
    return undefined
  }
  const mGt = resto.match(/>\s*([^\s:]+)/)
  if (mGt) { const f = aplicar(mGt[1]); if (f) { fecha = f; resto = resto.replace(mGt[0], '') } }
  if (!fecha) {
    const mBare = resto.match(/\b(hoy|mañana|manana)\b/i)
    if (mBare) { fecha = aplicar(mBare[1]); resto = resto.replace(mBare[0], '') }
  }
  return { fecha, resto }
}

/** Fecha límite sugerida según prioridad: Alta=1 día, Media=3 días, Baja=7 días */
export function fechaPorPrioridad(prioridad: Prioridad): string {
  return fechaRelativa(prioridad === 'Alta' ? 1 : prioridad === 'Baja' ? 7 : 3)
}

function isoLocal(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
/** Fecha (ISO local) sumando `dias` a hoy. */
export function isoMasDias(dias: number): string {
  const d = new Date(); d.setDate(d.getDate() + dias); return isoLocal(d)
}
/** Fecha (ISO local) sumando `dias` a una fecha ISO arbitraria (no solo a hoy) — usada por las
    métricas de racha (Fase 9.1), que necesitan caminar fecha a fecha hacia atrás. */
export function isoSumarDias(iso: string, dias: number): string {
  const d = new Date(iso + 'T00:00'); d.setDate(d.getDate() + dias); return isoLocal(d)
}
/** Próximo sábado (fin de semana) en ISO local. */
export function isoProximoFinDeSemana(): string {
  const d = new Date(); const diff = (6 - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + diff); return isoLocal(d)
}

export interface LineaParseada {
  titulo: string
  descripcion: string
  responsable: string
  prioridad?: Prioridad
  fechaLimite?: string
  repetir?: string
}

// Fase 10.1 (i18n es-MX consistente): nombres de día vía Intl en vez de un array hardcodeado —
// 2024-01-07 es domingo, así que sumarle `dow` días da el día de esa semana con el índice
// correcto (0=domingo..6=sábado, igual que `Date.getDay()`).
const FMT_DIA_LARGO = new Intl.DateTimeFormat('es-MX', { weekday: 'long' })
export function nombreDiaSemana(dow: number): string {
  return FMT_DIA_LARGO.format(new Date(2024, 0, 7 + dow))
}
const FMT_MES_LARGO = new Intl.DateTimeFormat('es-MX', { month: 'long' })
/** Nombre del mes (0-indexado, como `Date.getMonth()`), con mayúscula inicial — Intl en es-MX
    devuelve el nombre en minúsculas ("enero"), pero `CalendarioView` ya lo mostraba capitalizado. */
export function nombreMes(mes: number): string {
  const n = FMT_MES_LARGO.format(new Date(2024, mes, 1))
  return n.charAt(0).toUpperCase() + n.slice(1)
}
const NOMBRES_DIAS = Array.from({ length: 7 }, (_, dow) => nombreDiaSemana(dow))
const UNIDAD_RE = /^(d(?:ias?)?|s(?:em(?:anas?)?)?|m(?:es(?:es)?)?)$/i
function normalizarUnidad(u: string): 'd' | 's' | 'm' {
  const c = u.toLowerCase()[0]
  return c === 's' || c === 'm' ? c : 'd'
}
const RE_REPETICION_CANTIDAD = /\*\s*cada(!)?\s*(\d+)\s*(d(?:ias?)?|s(?:em(?:anas?)?)?|m(?:es(?:es)?)?)\b/i
const RE_REPETICION_DIAS = /\*\s*cada(!)?\s*((?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)(?:\s*(?:,|y)\s*(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo))*)\b/i

/** Extrae `*cada 3d`, `*cada! 7d`, `*cada 2 semanas` o `*cada lunes y jueves` → regla normalizada ('7d', '!7d', 'w:1,4') */
export function parsearRepeticion(texto: string): { regla?: string; resto: string } {
  let resto = texto
  let m = resto.match(RE_REPETICION_CANTIDAD)
  if (m && UNIDAD_RE.test(m[3])) {
    const desde = m[1] ? '!' : ''
    resto = resto.replace(m[0], '')
    return { regla: `${desde}${m[2]}${normalizarUnidad(m[3])}`, resto }
  }
  m = resto.match(RE_REPETICION_DIAS)
  if (m) {
    const desde = m[1] ? '!' : ''
    const dias = [...new Set(m[2].split(/\s*(?:,|y)\s*/).map(d => NOMBRES_DIAS.indexOf(d.toLowerCase().replace('miercoles', 'miércoles').replace('sabado', 'sábado'))))].filter(d => d >= 0).sort()
    resto = resto.replace(m[0], '')
    if (dias.length) return { regla: `${desde}w:${dias.join(',')}`, resto }
  }
  return { resto }
}

const ORDINALES = ['', 'primer', 'segundo', 'tercer', 'cuarto', 'quinto']

/** Fase 8.7 (RRULE avanzado): sufijos opcionales `;until:YYYY-MM-DD` y/o `;count:N` al final de
    cualquier regla existente — puramente aditivos a la gramática: una regla sin sufijos (todo lo
    que ya había antes de esta fase) pasa por aquí sin cambios. `base` conserva el prefijo `!` si
    lo tenía, para no tocar la lógica de `desde`/`cuerpo` que ya usan `describirRepeticion` y
    `siguienteFecha`. */
export interface SufijosRepeticion { until?: string; count?: number }
export function extraerSufijos(regla: string): { base: string; sufijos: SufijosRepeticion } {
  let base = regla
  const sufijos: SufijosRepeticion = {}
  const mUntil = base.match(/;until:(\d{4}-\d{2}-\d{2})/)
  if (mUntil) { sufijos.until = mUntil[1]; base = base.replace(mUntil[0], '') }
  const mCount = base.match(/;count:(\d+)/)
  if (mCount) { sufijos.count = Number(mCount[1]); base = base.replace(mCount[0], '') }
  return { base, sufijos }
}

/** N-ésima ocurrencia de un día de la semana en un mes dado (`mes` 0-indexado, como `Date`).
    Si el mes no tiene una N-ésima ocurrencia (ej. un "5º martes" que no existe), `Date` normaliza
    hacia el mes siguiente — comportamiento aceptado, documentado aquí a propósito. */
function enesimoDiaSemana(anio: number, mes: number, n: number, dow: number): Date {
  const primero = new Date(anio, mes, 1)
  const dia = 1 + ((dow - primero.getDay() + 7) % 7) + (n - 1) * 7
  return new Date(anio, mes, dia)
}

/** Texto legible de una regla de recurrencia: "cada lunes", "cada 2 semanas (desde que se completa)",
    "el 2º martes de cada mes", con sufijo de fin si aplica ("hasta el 2026-12-31", "quedan 3"). */
export function describirRepeticion(regla: string): string {
  const { base, sufijos } = extraerSufijos(regla)
  const desde = base.startsWith('!')
  const cuerpo = desde ? base.slice(1) : base
  let texto: string
  if (cuerpo.startsWith('nth:')) {
    const [, nStr, dowStr] = cuerpo.split(':')
    const n = Number(nStr); const dow = Number(dowStr)
    texto = `el ${ORDINALES[n] || n + 'º'} ${NOMBRES_DIAS[dow]} de cada mes`
  } else if (cuerpo.startsWith('w:')) {
    const dias = cuerpo.slice(2).split(',').map(Number)
    texto = 'cada ' + dias.map(d => NOMBRES_DIAS[d]).join(' y ')
  } else {
    const n = parseInt(cuerpo, 10)
    const unidad = cuerpo.slice(String(n).length)
    if (unidad === 'd' && n === 1) texto = 'cada día'
    else {
      const nombre = unidad === 's' ? (n === 1 ? 'semana' : 'semanas') : unidad === 'm' ? (n === 1 ? 'mes' : 'meses') : (n === 1 ? 'día' : 'días')
      texto = `cada ${n} ${nombre}`
    }
  }
  if (desde) texto += ' (desde que se completa)'
  if (sufijos.until) texto += ` hasta el ${sufijos.until}`
  if (sufijos.count !== undefined) texto += ` (quedan ${sufijos.count})`
  return texto
}

/** Siguiente fecha ISO local para una regla de recurrencia, contada a partir de `base` (ISO).
    Ignora los sufijos `;until`/`;count` (son responsabilidad de `proximaInstanciaRepeticion`,
    que decide si corresponde crear la siguiente instancia o no). */
export function siguienteFecha(regla: string, base: string): string {
  const { base: reglaBase } = extraerSufijos(regla)
  const cuerpo = reglaBase.startsWith('!') ? reglaBase.slice(1) : reglaBase
  const baseISO = base || hoyISO()
  if (cuerpo.startsWith('nth:')) {
    const [, nStr, dowStr] = cuerpo.split(':')
    const n = Number(nStr); const dow = Number(dowStr)
    const d = new Date(baseISO + 'T00:00')
    let candidato = enesimoDiaSemana(d.getFullYear(), d.getMonth(), n, dow)
    if (candidato <= d) candidato = enesimoDiaSemana(d.getFullYear(), d.getMonth() + 1, n, dow)
    return isoLocal(candidato)
  }
  if (cuerpo.startsWith('w:')) {
    const dias = cuerpo.slice(2).split(',').map(Number).filter(n => !Number.isNaN(n))
    const d = new Date(baseISO + 'T00:00')
    for (let i = 1; i <= 7; i++) {
      const nd = new Date(d); nd.setDate(nd.getDate() + i)
      if (!dias.length || dias.includes(nd.getDay())) return isoLocal(nd)
    }
    return isoLocal(d)
  }
  const n = parseInt(cuerpo, 10) || 1
  const unidad = cuerpo.slice(String(n).length)
  const dias = unidad === 's' ? n * 7 : unidad === 'm' ? n * 30 : n
  const d = new Date(baseISO + 'T00:00'); d.setDate(d.getDate() + dias)
  return isoLocal(d)
}

/** Decide si (y cómo) crear la siguiente instancia de un pendiente recurrente, respetando
    `;until`/`;count` — encapsula toda la lógica de fin de serie en un solo lugar testeable, en
    vez de repartirla entre `store.tsx` y esta función. Devuelve `null` si la serie ya terminó. */
export function proximaInstanciaRepeticion(regla: string, fechaBase: string): { fechaLimite: string; repetir: string } | null {
  const { base, sufijos } = extraerSufijos(regla)
  if (sufijos.count !== undefined && sufijos.count <= 0) return null
  const nuevaFecha = siguienteFecha(regla, fechaBase)
  if (sufijos.until && nuevaFecha > sufijos.until) return null
  let nuevoRepetir = base
  if (sufijos.until) nuevoRepetir += ';until:' + sufijos.until
  if (sufijos.count !== undefined) nuevoRepetir += ';count:' + (sufijos.count - 1)
  return { fechaLimite: nuevaFecha, repetir: nuevoRepetir }
}

/** «- Título: descripción @Resp1 @Resp2 !alta >mañana *cada lunes» → campos del pendiente */
export function parsearLinea(raw: string): LineaParseada | null {
  let t = String(raw).trim().replace(/^\s*[-*+•]\s*/, '').replace(/^\[[ xX]\]\s*/, '').trim()
  if (!t) return null
  const rep = parsearRepeticion(t); t = rep.resto
  let prioridad: Prioridad | undefined
  t = t.replace(/!(alta|media|baja)\b/i, (_m, p: string) => { prioridad = (p[0].toUpperCase() + p.slice(1).toLowerCase()) as Prioridad; return '' })
  const resps: string[] = []
  t = t.replace(/@([\p{L}\d._-]+)/gu, (_m, n: string) => { resps.push(n); return '' })
  const ef = extraerFecha(t); t = ef.resto
  t = t.replace(/\s{2,}/g, ' ').trim()
  const idx = t.indexOf(':')
  let titulo = t, descripcion = ''
  if (idx > 0) { titulo = t.slice(0, idx).trim(); descripcion = t.slice(idx + 1).trim() }
  if (!titulo) return null
  return { titulo, descripcion, responsable: resps.join(', '), prioridad, fechaLimite: ef.fecha, repetir: rep.regla }
}

/* ---- H1 — Minuta: viñetas anidadas → subtareas ----
   Una minuta reutilizable (escuela/trabajo/día a día) es una nota cuyas viñetas de nivel
   superior (- ) generan pendientes y las viñetas indentadas (2+ espacios) generan sus
   subtareas. Puro texto → sin acoplar al DOM del editor. */

export interface SubtareaLigera { texto: string; responsable?: string; fechaLimite?: string }
export interface EntradaMinuta extends Omit<LineaParseada, 'titulo'> {
  titulo: string
  subtareas: SubtareaLigera[]
}

/** Convierte una línea ya parseada en los campos de una Subtarea (texto + responsable + fecha). */
export function subtareaDeLinea(parsed: LineaParseada): SubtareaLigera {
  const texto = parsed.descripcion ? `${parsed.titulo}: ${parsed.descripcion}` : parsed.titulo
  return { texto, responsable: parsed.responsable || undefined, fechaLimite: parsed.fechaLimite }
}

/** Agrupa el texto de una nota en pendientes (viñetas sin sangría) y sus subtareas (indentadas).
    La prosa (líneas sin viñeta) se ignora; la profundidad se aplana a un nivel (H1). */
export function parsearMinuta(texto: string): EntradaMinuta[] {
  const resultado: EntradaMinuta[] = []
  let actual: EntradaMinuta | null = null
  for (const rawLinea of String(texto).split(/\r?\n/)) {
    const sangria = (rawLinea.match(/^\s*/)?.[0].length) ?? 0
    const linea = rawLinea.replace(/^\s+/, '')
    if (!/^[-*+•]\s/.test(linea)) continue
    const parsed = parsearLinea(linea)
    if (!parsed) continue
    const entrada: EntradaMinuta = { ...parsed, subtareas: [] }
    if (sangria >= 2 && actual) actual.subtareas.push(subtareaDeLinea(parsed))
    else { actual = entrada; resultado.push(entrada) }
  }
  return resultado
}

export function esBullet(texto: string): boolean {
  return /^\s*[-*+•]\s+\S/.test(texto)
}

/* ---- H2 — Promoción: subtareas ↔ pendientes ----
   Parte pura y testeable de A2/A3 (un pendiente con subtareas → proyecto real;
   una subtarea → pendiente independiente). El store orquesta llamando a estas. */

/** Encuentra una subtarea por id recorriendo `children` en profundidad. */
export function buscarSubtarea(arr: Subtarea[], sid: string): Subtarea | null {
  for (const s of arr) {
    if (s.id === sid) return s
    if (s.children) {
      const r = buscarSubtarea(s.children, sid)
      if (r) return r
    }
  }
  return null
}

/** Devuelve una copia del árbol de subtareas sin la indicada (inmutable, recursivo). */
export function quitarSubtarea(arr: Subtarea[], sid: string): Subtarea[] {
  return arr
    .filter((s) => s.id !== sid)
    .map((s) => (s.children ? { ...s, children: quitarSubtarea(s.children, sid) } : s))
}

/** A2 — convierte las subtareas de un pendiente en Pendientes del proyecto recién creado:
    cada sub-subtarea (`children`) pasa a ser subtarea del pendiente que la contiene. */
export function pendientesDesdeSubtareas(
  p: Pick<Pendiente, 'subtareas' | 'responsable' | 'prioridad' | 'origenNota'>,
  proyectoId: string | undefined,
  proyecto: string,
): Pendiente[] {
  return p.subtareas.map((sub) => normalizar({
    titulo: sub.texto,
    responsable: sub.responsable || p.responsable,
    fechaLimite: sub.fechaLimite || '',
    prioridad: p.prioridad,
    proyectoId,
    proyecto,
    origenNota: p.origenNota,
    subtareas: (sub.children || []).map((c) => ({ ...c })),
  }))
}

/* Persistencia segura: localStorage si existe, memoria si no */
const mem: Record<string, string> = {}
let avisoQuotaMostrado = false
export const storage = {
  get(k: string): string | null {
    try { const v = localStorage.getItem(k); if (v !== null) return v } catch { /* noop */ }
    return mem[k] ?? null
  },
  set(k: string, v: string) {
    mem[k] = v
    try { localStorage.setItem(k, v) }
    catch (e) {
      const esQuota = e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)
      if (esQuota && !avisoQuotaMostrado) {
        avisoQuotaMostrado = true
        toast.error('Se llenó el almacenamiento local: los últimos cambios podrían no guardarse. Borra adjuntos/notas grandes o exporta y limpia datos.')
      }
    }
  },
}

/** Horario por defecto al agendar: solo fecha (sin hora) → 08:00, bloque de 5 min; hora sin
    duración → 15 min. Sin fecha no se toca nada (no se agenda solo). */
export function defaultsHorario(fecha: string, hora: string, duracionMin?: number): { hora: string; duracionMin?: number } {
  if (!fecha) return { hora, duracionMin }
  if (!hora) return { hora: '08:00', duracionMin: 5 }
  if (!duracionMin) return { hora, duracionMin: 15 }
  return { hora, duracionMin }
}

/** Normaliza un nombre de proyecto para comparar sin distinguir mayúsculas/acentos/espacios
    redundantes — usado para resolver `proyecto` (nombre) contra `proyectoId` (referencia). */
export function normalizarNombreProyecto(nombre: string): string {
  return nombre.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Única fuente de verdad para asignar un pendiente a un proyecto: `proyectoId` manda,
    `proyecto` (nombre) es siempre un espejo derivado — nunca se escribe uno sin el otro.
    Si `proyectoId` apunta a un proyecto que ya no existe (borrado en otro dispositivo,
    no sincronizado todavía), se conserva el nombre anterior en vez de vaciarlo: así la
    tarea no queda muda mientras el dato llega. Pasar `proyectoId: undefined` desvincula
    de verdad (limpia ambos campos). */
export function asignarProyecto(
  proyectoId: string | undefined,
  proyectos: { id: string; nombre: string }[],
  nombreAnterior = '',
): { proyectoId: string | undefined; proyecto: string } {
  if (!proyectoId) return { proyectoId: undefined, proyecto: '' }
  const p = proyectos.find(pr => pr.id === proyectoId)
  return { proyectoId, proyecto: p ? p.nombre : nombreAnterior }
}

export function normalizar(p: Partial<Pendiente>): Pendiente {
  const base: Pendiente = {
    id: uid(), titulo: '', solicitante: '', responsable: '', descripcion: '',
    prioridad: 'Media', estado: 'pendiente', fechaLimite: '', hora: '', proyecto: '',
    etiquetas: [], subtareas: [], comentarios: [], adjuntos: [], origenNota: null,
    creado: new Date().toISOString(), modificado: new Date().toISOString(), fechaCompletado: null,
    ...p,
  }
  const { hora, duracionMin } = defaultsHorario(base.fechaLimite, base.hora || '', base.duracionMin)
  return { ...base, hora, duracionMin }
}

/** Construye un enlace de Google Calendar con el evento prellenado */
export function googleCalendarUrl(titulo: string, fecha: string, hora?: string, descripcion?: string): string | null {
  if (!fecha) return null
  const limpiar = (s: string) => s.replace(/[-:]/g, '')
  let start: string, end: string
  if (hora) {
    const ini = new Date(`${fecha}T${hora}:00`)
    const fin = new Date(ini.getTime() + 60 * 60 * 1000) // 1 hora
    const fmt = (d: Date) => limpiar(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`)
    start = fmt(ini); end = fmt(fin)
  } else {
    const d = fecha.replace(/-/g, '')
    const sig = new Date(`${fecha}T00:00:00`); sig.setDate(sig.getDate() + 1)
    start = d
    end = `${sig.getFullYear()}${String(sig.getMonth() + 1).padStart(2, '0')}${String(sig.getDate()).padStart(2, '0')}`
  }
  const params = new URLSearchParams({ action: 'TEMPLATE', text: titulo, dates: `${start}/${end}` })
  if (descripcion) params.set('details', descripcion)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Pendiente "activo": no archivado ni borrado. Usado para excluir de las vistas normales
    los archivados (estilo Gmail) y los borrados suaves que viven en la Papelera. */
export function activo(p: Pendiente): boolean {
  return !p.archivado && !p.borrado
}

/** Filtro de contexto por Espacio (Fase 4 / E2, extendido en H11): decide si un pendiente se
    muestra con el espacio activo. `espacioActualId === null` = «Todos» (nada se filtra).
    `espacioActualId === ESPACIO_GENERAL_ID` = todo lo que NO tiene un Espacio real: pendientes
    sin `proyectoId`, o cuyo `proyectoId` resuelve a un proyecto sin `espacioId` (o a ningún
    proyecto — huérfano, se trata como General en vez de ocultarse, ver H11/DECISIONS_LOG.md).
    Con un espacio real activo, el pendiente aparece SOLO si su `proyectoId` resuelve a un
    proyecto cuyo `espacioId` coincide con el activo. `proyectos` es un map id→proyecto ya
    memoizado por quien llama (cada vista construye el suyo a partir del store). */
export function enEspacio(
  p: { proyectoId?: string | null },
  espacioActualId: string | null,
  proyectos: Record<string, { espacioId?: string | null }>,
): boolean {
  if (espacioActualId == null) return true
  if (espacioActualId === ESPACIO_GENERAL_ID) return !p.proyectoId || !proyectos[p.proyectoId]?.espacioId
  if (!p.proyectoId) return false
  const proyecto = proyectos[p.proyectoId]
  if (!proyecto) return false
  return proyecto.espacioId === espacioActualId
}

/** Variante para proyectos (se usa en `ProyectosView`): mismo criterio que `enEspacio` pero
    sin resolver el map — el propio proyecto ya declara su `espacioId`. `espacioActualId ===
    null` = «Todos»; `=== ESPACIO_GENERAL_ID` = proyectos sin `espacioId` (H11); si no, un
    proyecto solo se muestra si pertenece al espacio activo. */
export function enEspacioProyecto(pr: { espacioId?: string | null }, espacioActualId: string | null): boolean {
  if (espacioActualId == null) return true
  if (espacioActualId === ESPACIO_GENERAL_ID) return !pr.espacioId
  return pr.espacioId === espacioActualId
}

/** Fecha flexible desde texto pegado de Excel: `dd/mm/aaaa`, `dd-mm-aaaa`, `aaaa-mm-dd`,
    `dd/mm/aa`. Devuelve ISO (aaaa-mm-dd) o '' si no reconoce el formato. */
export function parsearFechaFlexible(texto: string): string {
  const t = String(texto || '').trim()
  if (!t) return ''
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return isoDesdePartes(+m[1], +m[2], +m[3])
  m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (m) {
    let anio = +m[3]
    if (anio < 100) anio += anio < 70 ? 2000 : 1900
    return isoDesdePartes(anio, +m[2], +m[1])
  }
  // Excel a veces exporta fechas como número de serie (días desde 1899-12-30)
  m = t.match(/^\d{4,6}$/)
  if (m) {
    const serie = +t
    const base = new Date(Date.UTC(1899, 11, 30))
    base.setUTCDate(base.getUTCDate() + serie)
    return isoDesdePartes(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate())
  }
  return ''
}

function isoDesdePartes(anio: number, mes: number, dia: number): string {
  if (!anio || mes < 1 || mes > 12 || dia < 1 || dia > 31) return ''
  const d = new Date(anio, mes - 1, dia)
  if (d.getFullYear() !== anio || d.getMonth() !== mes - 1 || d.getDate() !== dia) return ''
  return anio + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0')
}

/** Hora flexible desde texto pegado de Excel: `10:00`, `10:00 am/pm`, `22:00`, `10 am`.
    Devuelve 'HH:MM' o '' si no reconoce el formato. */
export function parsearHoraFlexible(texto: string): string {
  const t = String(texto || '').trim().toLowerCase()
  if (!t) return ''
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)?$/)
  if (!m) return ''
  let h = +m[1]
  const min = m[2] ? +m[2] : 0
  const suf = m[3]?.replace(/\./g, '')
  if (suf === 'pm' && h < 12) h += 12
  if (suf === 'am' && h === 12) h = 0
  if (h > 23 || min > 59) return ''
  return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0')
}

export function descargar(nombre: string, contenido: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nombre; a.click()
  URL.revokeObjectURL(url)
}
