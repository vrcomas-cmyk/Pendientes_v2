/* Regla de exclusividad de overlays (PDS §5.4, Epic 1 del backlog): un solo overlay modal
   activo a la vez, sin excepción. Overlay = cualquier superficie que toma foco exclusivo
   (diálogo de tarea, peek de detalle, paleta de comandos, confirmación de descarte).
   Reducer puro y testeable; el `UIProvider` lo usa como fuente única: abrir un overlay
   reemplaza al activo (cierra el anterior) y `cerrar` solo desactiva si coincide. Los widgets
   se atenían mientras `overlay !== 'ninguno'` (ver WidgetsLayer).
   H4 — Epic 1 «Confirmación antes de descartar una edición en curso»: cuando el modal de tarea
   tiene cambios sin guardar y se intenta cerrar o abrir otro overlay, el UIProvider interpone
   `'confirmar-cierre'`. Cerrar ese overlay (`cerrar` de `confirmar-cierre` o de `modal`, el
   cierre pendiente del formulario que quedó montado debajo) lo desactiva; cualquier otro no. */

export type TipoOverlay = 'ninguno' | 'modal' | 'peek' | 'paleta' | 'confirmar-cierre'

export type AccionOverlay = { tipo: 'abrir' | 'cerrar'; overlay: Exclude<TipoOverlay, 'ninguno'> }

export function overlayReducer(actual: TipoOverlay, accion: AccionOverlay): TipoOverlay {
  switch (accion.tipo) {
    case 'abrir':
      return accion.overlay
    case 'cerrar':
      if (actual === accion.overlay) return 'ninguno'
      if (actual === 'confirmar-cierre' && accion.overlay === 'modal') return 'ninguno'
      return actual
  }
}

/** True mientras haya un overlay modal activo (los widgets flotantes deben atenuarse). */
export function esOverlay(overlay: TipoOverlay): boolean {
  return overlay !== 'ninguno'
}