import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/store'
import { esBullet, parsearLinea, fechaPorPrioridad } from '@/lib/app-utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Image as ImageIcon, ListChecks, Trash2, Search, StickyNote, ChevronLeft } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-is-mobile'

/** Serializa el editor: vacía los chips (se rehidratan al cargar) */
function serializar(editor: HTMLElement): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = editor.innerHTML
  tmp.querySelectorAll('.pchip').forEach(c => { c.innerHTML = ''; c.className = 'pchip' })
  return tmp.innerHTML
}

export default function NotesView() {
  const app = useApp()
  const { notas, pendientes, notaActualId, setNotaActualId, crearNota, actualizarNota, eliminarNota, crearPendiente, toggleCompletar, abrirModal } = app
  const isMobile = useIsMobile()
  const [filtro, setFiltro] = useState('')
  const [estadoGuardado, setEstadoGuardado] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)
  const tituloRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cargadaRef = useRef<string | null>(null)
  const editorEnfoco = useRef(false)

  const nota = notas.find(n => n.id === notaActualId) || null

  /* ---- Carga de nota en el editor (solo al CAMBIAR de nota, nunca al sincronizar) ---- */
  useEffect(() => {
    if (!nota || !editorRef.current) { cargadaRef.current = null; return }
    if (cargadaRef.current === nota.id) return
    cargadaRef.current = nota.id
    editorRef.current.innerHTML = nota.contenidoHTML || ''
    if (tituloRef.current) tituloRef.current.value = nota.titulo
    hidratarChips()
    setEstadoGuardado('')
  }, [notaActualId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Rehidratar chips cuando cambian los pendientes (pero NO mientras escribes) ---- */
  useEffect(() => { if (!editorEnfoco.current) hidratarChips() }, [pendientes]) // eslint-disable-line react-hooks/exhaustive-deps

  function hidratarChips() {
    const ed = editorRef.current
    if (!ed) return
    ed.querySelectorAll<HTMLElement>('.pchip').forEach(chip => {
      const pid = chip.dataset.pid || ''
      const p = pendientes.find(x => x.id === pid)
      chip.setAttribute('contenteditable', 'false')
      if (!p) {
        chip.classList.add('del'); chip.classList.remove('done')
        chip.innerHTML = '<span class="pchip-t">pendiente eliminado</span>'
        return
      }
      chip.classList.toggle('done', p.estado === 'completado')
      chip.classList.remove('del')
      chip.title = 'Clic para abrir el detalle' + (p.responsable ? ' · 👤 ' + p.responsable : '')
      chip.innerHTML =
        `<input type="checkbox" class="pchip-check" ${p.estado === 'completado' ? 'checked' : ''}>` +
        `<span class="pchip-t">${escapeHtml(p.titulo)}</span>` +
        (p.responsable ? `<span class="pchip-resp">👤${escapeHtml(p.responsable)}</span>` : '')
    })
  }

  /* ---- Guardado con debounce ---- */
  function programarGuardado() {
    if (!nota) return
    setEstadoGuardado('Guardando…')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(guardarAhora, 600)
  }
  function guardarAhora() {
    const ed = editorRef.current
    if (!ed || !nota) return
    actualizarNota(nota.id, {
      titulo: tituloRef.current?.value.trim() || 'Sin título',
      contenidoHTML: serializar(ed),
    })
    setEstadoGuardado('✓ Guardado')
  }

  /* ---- Crear pendiente desde una línea con viñeta ---- */
  function crearChipDesdeBloque(bloque: HTMLElement | Text): boolean {
    const texto = bloque.textContent || ''
    if (!esBullet(texto)) return false
    const parsed = parsearLinea(texto)
    if (!parsed) return false
    const prioridad = parsed.prioridad || 'Media'
    const p = crearPendiente({
      titulo: parsed.titulo,
      descripcion: parsed.descripcion,
      responsable: parsed.responsable,
      prioridad,
      fechaLimite: parsed.fechaLimite || fechaPorPrioridad(prioridad),
      origenNota: { notaId: notaActualId! },
    })
    const chip = document.createElement('span')
    chip.className = 'pchip'
    chip.dataset.pid = p.id
    chip.setAttribute('contenteditable', 'false')
    const wrap = document.createElement('div')
    wrap.appendChild(chip)
    if (bloque.nodeType === Node.TEXT_NODE) (bloque as Text).replaceWith(wrap)
    else (bloque as HTMLElement).replaceWith(wrap)
    return true
  }

  /* Enter sobre una línea «- Título: descripción» → chip + nueva línea */
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Enter' || e.shiftKey) return
    const ed = editorRef.current
    const sel = window.getSelection()
    if (!ed || !sel || !sel.rangeCount) return
    let node: Node | null = sel.anchorNode
    while (node && node.parentNode !== ed) node = node.parentNode
    if (!node) return
    const texto = node.textContent || ''
    if (!esBullet(texto)) return
    e.preventDefault()
    if (crearChipDesdeBloque(node as HTMLElement)) {
      // nueva línea vacía después del chip y colocar el cursor ahí
      const chips = ed.querySelectorAll('.pchip')
      const ultimo = chips[chips.length - 1]?.parentElement
      const nueva = document.createElement('div')
      nueva.innerHTML = '<br>'
      ultimo?.after(nueva)
      const range = document.createRange()
      range.setStart(nueva, 0); range.collapse(true)
      sel.removeAllRanges(); sel.addRange(range)
      hidratarChips()
      guardarAhora()
      toast.success('Pendiente creado: ' + (parsearLinea(texto)?.titulo || ''))
    }
  }

  /* Botón: convertir todas las viñetas de la nota */
  function extraerTodas() {
    const ed = editorRef.current
    if (!ed || !nota) return
    let creados = 0
    Array.from(ed.childNodes).forEach(b => {
      if (b.nodeType === Node.TEXT_NODE && esBullet(b.textContent || '')) {
        if (crearChipDesdeBloque(b as Text)) creados++
      } else if (b.nodeType === Node.ELEMENT_NODE) {
        const el = b as HTMLElement
        if (!el.querySelector('img,table,.pchip') && esBullet(el.textContent || '')) {
          if (crearChipDesdeBloque(el)) creados++
        }
      }
    })
    if (creados) { hidratarChips(); guardarAhora(); toast.success(`${creados} pendiente(s) creados`) }
    else toast('No se encontraron líneas con -, * o + (o ya son pendientes)')
  }

  /* ---- Clicks dentro del editor (delegación) ---- */
  function onClickEditor(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    if (target.classList.contains('pchip-check')) {
      e.preventDefault()
      const chip = target.closest<HTMLElement>('.pchip')
      if (chip?.dataset.pid) toggleCompletar(chip.dataset.pid)
      return
    }
    const chip = target.closest<HTMLElement>('.pchip')
    if (chip && !chip.classList.contains('del') && chip.dataset.pid) {
      abrirModal(chip.dataset.pid)
    }
  }

  /* ---- Pegado: imágenes inline; texto/tablas pasan normal ---- */
  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items || []
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        e.preventDefault()
        const file = it.getAsFile()
        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => { insertarHTML(`<img src="${ev.target?.result}">`); programarGuardado() }
        reader.readAsDataURL(file)
        return
      }
    }
  }
  function insertarImagenBtn() {
    const inp = document.createElement('input')
    inp.type = 'file'; inp.accept = 'image/*'
    inp.onchange = () => {
      const f = inp.files?.[0]; if (!f) return
      const r = new FileReader()
      r.onload = e => { insertarHTML(`<img src="${e.target?.result}">`); programarGuardado() }
      r.readAsDataURL(f)
    }
    inp.click()
  }
  function insertarHTML(html: string) {
    const ed = editorRef.current
    if (!ed) return
    ed.focus()
    const sel = window.getSelection()
    if (sel && sel.rangeCount && ed.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0)
      range.deleteContents()
      range.insertNode(range.createContextualFragment(html))
      sel.collapseToEnd()
    } else {
      ed.insertAdjacentHTML('beforeend', html)
    }
  }

  /* ---- Lista de notas con progreso ---- */
  const notasFiltradas = notas
    .filter(n => (n.titulo + ' ' + n.contenidoHTML.replace(/<[^>]+>/g, '')).toLowerCase().includes(filtro.toLowerCase()))
    .sort((a, b) => new Date(b.modificado).getTime() - new Date(a.modificado).getTime())

  const panelLista = (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-2">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-2 text-muted-foreground" />
          <Input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Filtrar..." className="h-7 pl-7 text-xs" />
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-1 scroll-thin">
        {notasFiltradas.map(n => {
          const rel = pendientes.filter(p => p.origenNota?.notaId === n.id)
          const hechas = rel.filter(p => p.estado === 'completado').length
          const resumen = n.contenidoHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          return (
            <div key={n.id} onClick={() => setNotaActualId(n.id)}
              className={'cursor-pointer rounded-lg p-2.5 ' + (notaActualId === n.id ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-accent')}>
              <div className="truncate text-sm font-semibold">{n.titulo}</div>
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
            <input ref={tituloRef} defaultValue={nota.titulo} onInput={programarGuardado} placeholder="Título de la nota"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold focus:outline-none" />
            <span className="hidden text-[10px] text-muted-foreground sm:inline">{estadoGuardado}</span>
            <button onClick={() => eliminarNota(nota.id)} className="shrink-0 px-1 text-muted-foreground hover:text-destructive" title="Eliminar nota"><Trash2 size={15} /></button>
          </div>
          <div className="flex items-center gap-1.5 border-b bg-muted/30 px-2 py-1.5">
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={insertarImagenBtn} title="Insertar imagen"><ImageIcon size={13} /></Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={extraerTodas} title="Convertir viñetas en pendientes">
              <ListChecks size={13} className="mr-1" /> Extraer viñetas
            </Button>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="nota-editor flex-1 overflow-y-auto p-4 text-sm scroll-thin"
            data-placeholder="Escribe libre. Pega capturas o tablas.  Pendiente: «- Título: descripción @Responsable !alta >mañana» y Enter ⏎"
            onInput={programarGuardado}
            onKeyDown={onKeyDown}
            onClick={onClickEditor}
            onPaste={onPaste}
            onFocus={() => { editorEnfoco.current = true }}
            onBlur={() => { editorEnfoco.current = false; guardarAhora(); hidratarChips() }}
          />
          <div className="border-t bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground">
            💡 <b>-</b> viñeta · <b>:</b> descripción · <b>@</b>responsable(s) · <b>!</b>alta/media/baja · <b>&gt;</b>fecha (mañana, viernes, +5d, 2026-06-20) — luego Enter ⏎
          </div>
        </>
      )}
    </div>
  )

  // MÓVIL: lista a pantalla completa; al tocar una nota, solo el editor (con botón Volver)
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
      </div>
    )
  }

  // ESCRITORIO: lista + editor lado a lado
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
    </div>
  )
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m] as string))
}
