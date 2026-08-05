import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/store'
import { parsearLinea, fechaPorPrioridad } from '@/lib/app-utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
import { Plus, Image as ImageIcon, ListChecks, Trash2, Search, StickyNote, ChevronLeft, Lock, Pencil, Check, Folder, FolderPlus, Bold, Italic, Heading2, MoreVertical } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { subirAdjunto, urlAdjunto } from '@/lib/adjuntos'
import PreviaParseo from '@/components/PreviaParseo'

const SIN_CARPETA = '__sin__'
const RE_BULLET = /^\s*[-*+•]\s+\S/
const strip = /^\s*[-*+•]\s+/

function serializar(editor: HTMLElement): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = editor.innerHTML
  tmp.querySelectorAll('.nota-task-draft').forEach(d => d.classList.remove('nota-task-draft'))
  return tmp.innerHTML
}
function cursorEn(el: Node) {
  const sel = window.getSelection(); if (!sel) return
  const r = document.createRange(); r.setStart(el, 0); r.collapse(true)
  sel.removeAllRanges(); sel.addRange(r)
}

export default function NotesView() {
  const app = useApp()
  const { notas, pendientes, notaActualId, setNotaActualId, crearNota, actualizarNota, eliminarNota, duplicarNota, crearPendiente, actualizarPendiente, toggleCompletar, abrirPeek } = app
  const isMobile = useIsMobile()
  const [filtro, setFiltro] = useState('')
  const [carpetaSel, setCarpetaSel] = useState<string>('todas')
  const [estadoGuardado, setEstadoGuardado] = useState('')
  const [editando, setEditando] = useState(false)
  const [carpetaDlg, setCarpetaDlg] = useState(false)
  const [carpetaVal, setCarpetaVal] = useState('')
  const [renombrarDlg, setRenombrarDlg] = useState<string | null>(null)
  const [renombrarVal, setRenombrarVal] = useState('')
  const [lineaActual, setLineaActual] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)
  const tituloRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cargadaRef = useRef<string | null>(null)
  const editorEnfoco = useRef(false)

  const nota = notas.find(n => n.id === notaActualId) || null
  const pendientesRef = useRef(pendientes)
  pendientesRef.current = pendientes

  const carpetas = [...new Set(notas.map(n => n.carpeta).filter(Boolean) as string[])].sort()

  /* ---- Carga de nota (solo al CAMBIAR de nota) ---- */
  useEffect(() => {
    if (!nota || !editorRef.current) { cargadaRef.current = null; return }
    if (cargadaRef.current === nota.id) return
    // Si había un guardado pendiente (debounce) de la nota anterior, se vuelca AHORA,
    // antes de reescribir el editor — si no, el timer viejo guardaría el HTML de la
    // nota nueva dentro de la nota anterior (closure obsoleto).
    if (timerRef.current) { clearTimeout(timerRef.current); guardarAhora() }
    cargadaRef.current = nota.id
    editorRef.current.innerHTML = nota.contenidoHTML || ''
    if (tituloRef.current) tituloRef.current.value = nota.titulo
    hidratarTareas()
    setEditando(!(nota.contenidoHTML || '').trim())
    setEstadoGuardado('')
  }, [notaActualId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Al desmontar la vista, vuelca cualquier guardado pendiente.
  useEffect(() => () => { if (timerRef.current) { clearTimeout(timerRef.current); guardarAhora() } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!editorEnfoco.current) hidratarTareas() }, [pendientes])

  /* Store -> editor: solo estado (check + color), NUNCA reescribe el texto que editas */
  function hidratarTareas() {
    const ed = editorRef.current
    if (!ed) return
    ed.querySelectorAll<HTMLElement>('.nota-task[data-pid]').forEach(div => {
      const p = pendientesRef.current.find(x => x.id === div.dataset.pid)
      if (!p) return
      div.dataset.prio = p.prioridad
      div.classList.toggle('done', p.estado === 'completado')
    })
  }

  /* Editor -> store: reparsea el texto de cada tarea y actualiza el pendiente si cambió */
  function sincronizarTareas() {
    const ed = editorRef.current
    if (!ed) return
    const vistos = new Set<string>()
    ed.querySelectorAll<HTMLElement>('.nota-task').forEach(div => {
      const pid = div.dataset.pid
      if (!pid) return
      if (vistos.has(pid)) { div.className = ''; delete div.dataset.pid; delete div.dataset.prio; return } // duplicado por split → texto normal
      vistos.add(pid)
      const p = pendientesRef.current.find(x => x.id === pid)
      if (!p) return
      const parsed = parsearLinea(div.textContent || '')
      if (!parsed) return
      const upd: Record<string, unknown> = {}
      if (parsed.titulo !== p.titulo) upd.titulo = parsed.titulo
      if (parsed.descripcion !== p.descripcion) upd.descripcion = parsed.descripcion
      if (parsed.responsable !== p.responsable) upd.responsable = parsed.responsable
      if (parsed.prioridad && parsed.prioridad !== p.prioridad) upd.prioridad = parsed.prioridad
      if (parsed.fechaLimite && parsed.fechaLimite !== p.fechaLimite) upd.fechaLimite = parsed.fechaLimite
      if (parsed.repetir !== p.repetir) upd.repetir = parsed.repetir
      if (Object.keys(upd).length) actualizarPendiente(pid, upd)
    })
  }

  /* ---- Guardado ----
   * Siempre contra `cargadaRef.current` (la nota realmente cargada en el editor ahora mismo),
   * nunca contra `nota` del closure: si el usuario cambia de nota antes de que dispare el
   * timer, `nota` sigue apuntando a la nota vieja pero el editor ya tiene otro contenido. */
  function programarGuardado() {
    if (!cargadaRef.current) return
    setEstadoGuardado('Guardando…')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(guardarAhora, 600)
  }
  function guardarAhora() {
    const ed = editorRef.current
    const id = cargadaRef.current
    if (!ed || !id) return
    sincronizarTareas()
    actualizarNota(id, { titulo: tituloRef.current?.value.trim() || 'Sin título', contenidoHTML: serializar(ed) })
    setEstadoGuardado('✓ Guardado')
  }
  function guardarYBloquear() { clearTimeout(timerRef.current); guardarAhora(); setEditando(false) }

  /* Convierte un bloque «- …» en una tarea editable (crea el pendiente, conserva el texto y tokens) */
  function commitTarea(bloque: HTMLElement | Text): { div: HTMLDivElement } | null {
    const raw = bloque.textContent || ''
    if (!RE_BULLET.test(raw)) return null
    const parsed = parsearLinea(raw)
    if (!parsed) return null
    const prioridad = parsed.prioridad || 'Media'
    const p = crearPendiente({
      titulo: parsed.titulo, descripcion: parsed.descripcion, responsable: parsed.responsable,
      prioridad, fechaLimite: parsed.fechaLimite || fechaPorPrioridad(prioridad), repetir: parsed.repetir,
      origenNota: { notaId: notaActualId! },
    })
    const div = document.createElement('div')
    div.textContent = raw.replace(strip, '')  // quita el «- », conserva título + tokens
    div.className = 'nota-task'
    div.dataset.pid = p.id
    div.dataset.prio = p.prioridad
    if (bloque.nodeType === Node.TEXT_NODE) (bloque as Text).replaceWith(div)
    else (bloque as HTMLElement).replaceWith(div)
    return { div }
  }

  function bloqueActual(): Node | null {
    const ed = editorRef.current
    const sel = window.getSelection()
    if (!ed || !sel || !sel.rangeCount) return null
    let node: Node | null = sel.anchorNode
    while (node && node.parentNode !== ed) node = node.parentNode
    return node
  }

  function formatear(cmd: string, valor?: string) {
    document.execCommand(cmd, false, valor)
    editorRef.current?.focus()
    programarGuardado()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); guardarYBloquear(); return }
    if (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); abrirCarpetaDlg(); return }
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'b') { e.preventDefault(); formatear('bold'); return }
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'i') { e.preventDefault(); formatear('italic'); return }
    if (e.key !== 'Enter' || e.shiftKey) return
    const node = bloqueActual()
    if (!node) return
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : null

    // Enter dentro de una tarea ya creada → termina y sigue en una línea normal
    if (el?.dataset.pid) {
      e.preventDefault()
      const nueva = document.createElement('div'); nueva.innerHTML = '<br>'
      el.after(nueva); cursorEn(nueva); guardarAhora()
      return
    }
    // Enter sobre «- Texto» (borrador) → lo convierte en tarea
    const texto = node.textContent || ''
    if (!RE_BULLET.test(texto)) return
    e.preventDefault()
    const res = commitTarea(node as HTMLElement)
    if (res) {
      const nueva = document.createElement('div'); nueva.innerHTML = '<br>'
      res.div.after(nueva); cursorEn(nueva)
      guardarAhora()
      toast.success('Pendiente creado: ' + (parsearLinea(texto)?.titulo || ''))
    }
  }

  /* Marca en vivo el bloque actual si empieza con «- » (aún sin confirmar), y muestra su previa de parseo.
     Limitado al bloque donde está el cursor (no todo el editor) — evita recorrer todo en cada tecla. */
  function onInputEditor() {
    const nodo = bloqueActual()
    const el = nodo && nodo.nodeType === Node.ELEMENT_NODE ? nodo as HTMLElement : null
    if (el && !el.dataset.pid) {
      const esDraft = RE_BULLET.test(el.textContent || '')
      el.classList.toggle('nota-task-draft', esDraft)
      setLineaActual(esDraft ? (el.textContent || '') : '')
    } else {
      setLineaActual('')
    }
    programarGuardado()
  }

  /* Extraer viñetas: convierte todos los «- » pendientes de la nota */
  function extraerTodas() {
    const ed = editorRef.current
    if (!ed || !nota) return
    let creados = 0
    Array.from(ed.childNodes).forEach(b => {
      if (b.nodeType === Node.TEXT_NODE && RE_BULLET.test(b.textContent || '')) { if (commitTarea(b as Text)) creados++ }
      else if (b.nodeType === Node.ELEMENT_NODE) {
        const el = b as HTMLElement
        if (!el.dataset.pid && !el.querySelector('img,table') && RE_BULLET.test(el.textContent || '')) { if (commitTarea(el)) creados++ }
      }
    })
    if (creados) { guardarAhora(); toast.success(`${creados} pendiente(s) creados`) }
    else toast('No se encontraron líneas con «- » sin convertir')
  }

  /* Click en el checkbox (área izquierda de la tarjeta) → completar.
     Click en el resto del chip, con la nota bloqueada (solo lectura) → abre el detalle rápido. */
  function onClickEditor(e: React.MouseEvent<HTMLDivElement>) {
    const div = (e.target as HTMLElement).closest<HTMLElement>('.nota-task')
    if (div?.dataset.pid) {
      const rect = div.getBoundingClientRect()
      if (e.clientX - rect.left <= 30) {
        e.preventDefault()
        div.classList.toggle('done')
        toggleCompletar(div.dataset.pid)
        return
      }
      if (!editando) { e.preventDefault(); abrirPeek(div.dataset.pid) }
    }
  }

  /* Sube la imagen (nube o dataUrl local pequeño vía subirAdjunto) y la inserta como <img data-adjunto-id> */
  async function subirEInsertarImagen(file: File) {
    if (!nota) return
    try {
      const a = await subirAdjunto(file, 'nota-' + nota.id)
      const url = await urlAdjunto(a)
      if (url) insertarHTML(`<img src="${url}" data-adjunto-id="${a.id}" data-adjunto-path="${a.path || ''}">`)
      programarGuardado()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo adjuntar la imagen')
    }
  }
  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items || []
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        e.preventDefault()
        const file = it.getAsFile(); if (!file) return
        subirEInsertarImagen(file)
        return
      }
    }
  }
  function insertarImagenBtn() {
    const inp = document.createElement('input')
    inp.type = 'file'; inp.accept = 'image/*'
    inp.onchange = () => {
      const f = inp.files?.[0]; if (!f) return
      subirEInsertarImagen(f)
    }
    inp.click()
  }
  function insertarHTML(html: string) {
    const ed = editorRef.current
    if (!ed) return
    ed.focus()
    const sel = window.getSelection()
    if (sel && sel.rangeCount && ed.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0); range.deleteContents()
      range.insertNode(range.createContextualFragment(html)); sel.collapseToEnd()
    } else ed.insertAdjacentHTML('beforeend', html)
  }

  /* ---- Carpetas ---- */
  const asignarCarpeta = (c: string | undefined) => { if (nota) actualizarNota(nota.id, { carpeta: c }) }
  const abrirCarpetaDlg = () => { if (nota) { setCarpetaVal(''); setCarpetaDlg(true) } }
  const confirmarCarpeta = () => { const c = carpetaVal.trim(); if (c) { asignarCarpeta(c); toast.success('Archivado en: ' + c) } setCarpetaDlg(false) }
  const contarPorCarpeta = (c: string) => notas.filter(n => n.carpeta === c).length
  const confirmarRenombrar = () => {
    const nuevo = renombrarVal.trim()
    if (nuevo && renombrarDlg) {
      notas.filter(n => n.carpeta === renombrarDlg).forEach(n => actualizarNota(n.id, { carpeta: nuevo }))
      if (carpetaSel === renombrarDlg) setCarpetaSel(nuevo)
    }
    setRenombrarDlg(null)
  }
  const eliminarCarpeta = (c: string) => {
    notas.filter(n => n.carpeta === c).forEach(n => actualizarNota(n.id, { carpeta: undefined }))
    if (carpetaSel === c) setCarpetaSel('todas')
    toast('Carpeta eliminada (las notas se conservan sin carpeta)')
  }

  const notasFiltradas = notas
    .filter(n => (n.titulo + ' ' + n.contenidoHTML.replace(/<[^>]+>/g, '')).toLowerCase().includes(filtro.toLowerCase()))
    .filter(n => carpetaSel === 'todas' || (carpetaSel === SIN_CARPETA ? !n.carpeta : n.carpeta === carpetaSel))
    .sort((a, b) => new Date(b.modificado).getTime() - new Date(a.modificado).getTime())

  const barraCarpetas = (
    <div className="flex gap-1.5 overflow-x-auto px-2 pb-1.5 scroll-thin">
      <button onClick={() => setCarpetaSel('todas')}
        className={'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] ' + (carpetaSel === 'todas' ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>Todas</button>
      {carpetas.map(c => (
        <div key={c} className={'inline-flex shrink-0 items-center rounded-full border text-[11px] ' + (carpetaSel === c ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
          <button onClick={() => setCarpetaSel(c)} className="flex items-center gap-1 py-0.5 pl-2.5 pr-1">
            <Folder size={10} />{c} <span className="opacity-70">({contarPorCarpeta(c)})</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button onClick={e => e.stopPropagation()} aria-label={'Opciones de la carpeta ' + c} className="px-1.5 py-0.5 opacity-70 hover:opacity-100"><MoreVertical size={10} /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => { setRenombrarDlg(c); setRenombrarVal(c) }}><Pencil size={12} className="mr-2" /> Renombrar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => eliminarCarpeta(c)} className="text-destructive"><Trash2 size={12} className="mr-2" /> Eliminar carpeta</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
      <button onClick={() => setCarpetaSel(SIN_CARPETA)}
        className={'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] ' + (carpetaSel === SIN_CARPETA ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>Sin carpeta</button>
    </div>
  )

  const panelLista = (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-2 pb-1">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-2 text-muted-foreground" />
          <Input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Filtrar..." className="h-7 pl-7 text-xs" />
        </div>
      </div>
      {barraCarpetas}
      <div className="flex-1 space-y-1 overflow-y-auto border-t p-1 scroll-thin">
        {notasFiltradas.map(n => {
          const rel = pendientes.filter(p => p.origenNota?.notaId === n.id)
          const hechas = rel.filter(p => p.estado === 'completado').length
          const resumen = n.contenidoHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          return (
            <ContextMenu key={n.id}>
              <ContextMenuTrigger asChild>
                <div onClick={() => setNotaActualId(n.id)}
                  className={'cursor-pointer rounded-lg p-2.5 ' + (notaActualId === n.id ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-accent')}>
                  <div className="flex items-center gap-1.5">
                    <div className="truncate text-sm font-semibold">{n.titulo}</div>
                    {n.carpeta && <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"><Folder size={9} />{n.carpeta}</span>}
                  </div>
                  {isMobile && resumen && <div className="mt-0.5 truncate text-xs text-muted-foreground">{resumen}</div>}
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(n.modificado).toLocaleDateString()}
                    {rel.length > 0 && <span className={hechas === rel.length ? 'text-green-600' : 'text-primary'}> · ✔ {hechas}/{rel.length}</span>}
                  </div>
                  {rel.length > 0 && (
                    <div className="mt-1 h-1 w-full rounded-full bg-muted">
                      <div className="h-1 rounded-full bg-primary transition-all" style={{ width: (hechas / rel.length) * 100 + '%' }} />
                    </div>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-44">
                <ContextMenuItem onClick={() => setNotaActualId(n.id)}>Abrir</ContextMenuItem>
                <ContextMenuItem onClick={() => duplicarNota(n.id)}>Duplicar</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem className="text-destructive" onClick={() => eliminarNota(n.id)}>Eliminar</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
        {!notasFiltradas.length && <p className="p-4 text-center text-xs text-muted-foreground">No hay notas.</p>}
      </div>
    </div>
  )

  const panelEditor = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
      {!nota ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Selecciona o crea una nota ✍️</div>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b p-2">
            {isMobile && (
              <Button size="sm" variant="ghost" onClick={() => setNotaActualId(null)} className="shrink-0 px-2"><ChevronLeft size={18} /></Button>
            )}
            <input ref={tituloRef} defaultValue={nota.titulo} onInput={programarGuardado} placeholder="Título de la nota" readOnly={!editando}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold focus:outline-none" />
            <span className="hidden text-[10px] text-muted-foreground sm:inline" aria-live="polite">{estadoGuardado}</span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 shrink-0 gap-1 px-2 text-[11px]" title="Carpeta (Ctrl+Shift+A)">
                  <Folder size={13} />{nota.carpeta ? <span className="max-w-[80px] truncate">{nota.carpeta}</span> : ''}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-[11px]">Mover a carpeta</DropdownMenuLabel>
                {carpetas.map(c => (
                  <DropdownMenuItem key={c} onClick={() => asignarCarpeta(c)}><Folder size={13} className="mr-2" />{c}{nota.carpeta === c && <Check size={13} className="ml-auto text-primary" />}</DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={abrirCarpetaDlg}><FolderPlus size={13} className="mr-2 text-primary" /> Nueva carpeta…</DropdownMenuItem>
                {nota.carpeta && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => asignarCarpeta(undefined)}>Quitar de carpeta</DropdownMenuItem></>}
              </DropdownMenuContent>
            </DropdownMenu>

            {editando
              ? <Button size="sm" className="h-7 shrink-0 text-xs" onClick={guardarYBloquear} title="Guardar y bloquear (Ctrl+Enter)"><Check size={13} className="mr-1" /> Guardar</Button>
              : <Button size="sm" variant="secondary" className="h-7 shrink-0 text-xs" onClick={() => setEditando(true)}><Pencil size={13} className="mr-1" /> Editar</Button>}

            <button onClick={() => eliminarNota(nota.id)} aria-label="Eliminar nota" className="shrink-0 px-1 text-muted-foreground hover:text-destructive" title="Eliminar nota"><Trash2 size={15} /></button>
          </div>

          {editando && (
            <div className="flex items-center gap-1.5 border-b bg-muted/30 px-2 py-1.5">
              <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={() => formatear('bold')} title="Negrita (Ctrl+B)" aria-label="Negrita"><Bold size={13} /></Button>
              <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={() => formatear('italic')} title="Cursiva (Ctrl+I)" aria-label="Cursiva"><Italic size={13} /></Button>
              <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={() => formatear('formatBlock', document.queryCommandValue('formatBlock').toLowerCase() === 'h3' ? 'p' : 'h3')} title="Encabezado" aria-label="Encabezado"><Heading2 size={13} /></Button>
              <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={insertarImagenBtn} title="Insertar imagen"><ImageIcon size={13} /></Button>
              <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={extraerTodas} title="Convertir viñetas en pendientes">
                <ListChecks size={13} className="mr-1" /> Extraer viñetas
              </Button>
              <span className="ml-auto hidden text-[10px] text-muted-foreground md:inline">Ctrl+Enter guarda · Ctrl+Shift+A archiva</span>
            </div>
          )}

          {!editando && (
            <div className="flex items-center gap-1.5 border-b bg-amber-50 px-3 py-1.5 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              <Lock size={12} /> Nota bloqueada (solo lectura). Toca <b>Editar</b> para modificar.
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable={editando}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Contenido de la nota"
            className={'nota-editor flex-1 overflow-y-auto p-4 text-sm scroll-thin ' + (editando ? '' : 'cursor-default select-text')}
            data-placeholder="Escribe libre. Empieza una línea con «- » para un pendiente; Enter lo crea. Vuelve y agrega «: contexto», «@resp», «!alta», «>mañana» cuando quieras."
            onInput={onInputEditor}
            onKeyDown={onKeyDown}
            onClick={onClickEditor}
            onPaste={onPaste}
            onFocus={() => { editorEnfoco.current = true }}
            onBlur={() => { editorEnfoco.current = false; if (editando) guardarAhora(); hidratarTareas() }}
          />
          {editando && (
            <div className="border-t bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground">
              {lineaActual
                ? <PreviaParseo texto={lineaActual} />
                : <>💡 <b>- </b>inicia un pendiente · <b>:</b> contexto · <b>@</b>responsable · <b>!</b>alta/media/baja · <b>&gt;</b>fecha · <b>*</b>repetición — se guardan solos y se quedan escritos en la nota.</>}
            </div>
          )}
        </>
      )}
    </div>
  )

  const carpetaDialog = (
    <Dialog open={carpetaDlg} onOpenChange={setCarpetaDlg}>
      <DialogContent className="max-w-xs">
        <DialogHeader><DialogTitle className="text-base">Archivar en carpeta</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Input autoFocus value={carpetaVal} onChange={e => setCarpetaVal(e.target.value)} placeholder="Nombre de la carpeta"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmarCarpeta() } }} />
          {carpetas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {carpetas.map(c => (
                <button key={c} onClick={() => setCarpetaVal(c)} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] hover:bg-accent"><Folder size={10} />{c}</button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setCarpetaDlg(false)}>Cancelar</Button>
          <Button onClick={confirmarCarpeta}><FolderPlus size={14} className="mr-1" /> Archivar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const renombrarDialog = (
    <Dialog open={!!renombrarDlg} onOpenChange={o => { if (!o) setRenombrarDlg(null) }}>
      <DialogContent className="max-w-xs">
        <DialogHeader><DialogTitle className="text-base">Renombrar carpeta</DialogTitle></DialogHeader>
        <Input autoFocus value={renombrarVal} onChange={e => setRenombrarVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmarRenombrar() } }} />
        <DialogFooter>
          <Button variant="secondary" onClick={() => setRenombrarDlg(null)}>Cancelar</Button>
          <Button onClick={confirmarRenombrar}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2">
        {!nota ? (
          <>
            <div className="flex shrink-0 items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-bold"><StickyNote size={15} className="text-primary" /> Notas</h2>
              <Button size="sm" onClick={() => { crearNota(); setTimeout(() => tituloRef.current?.focus(), 80) }}><Plus size={14} className="mr-1" /> Nueva</Button>
            </div>
            <div className="min-h-0 flex-1">{panelLista}</div>
          </>
        ) : (
          <div className="min-h-0 flex-1">{panelEditor}</div>
        )}
        {carpetaDialog}
        {renombrarDialog}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold"><StickyNote size={15} className="text-primary" /> Notas</h2>
        <Button size="sm" onClick={() => { crearNota(); setTimeout(() => tituloRef.current?.select(), 60) }}><Plus size={14} className="mr-1" /> Nueva nota</Button>
      </div>
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="w-1/4 min-w-[185px]">{panelLista}</div>
        <div className="min-h-0 flex-1">{panelEditor}</div>
      </div>
      {carpetaDialog}
      {renombrarDialog}
    </div>
  )
}
