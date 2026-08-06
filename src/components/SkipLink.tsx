/** Enlace "Saltar al contenido" (Fase 10.1, accesibilidad): invisible hasta que recibe foco por
    teclado (Tab desde el body), evita que un usuario de lector de pantalla / navegación por
    teclado tenga que pasar por todo el sidebar en cada carga de página. */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="fixed left-2 top-2 z-[100] -translate-y-16 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-0 transition-transform focus:translate-y-0 focus:opacity-100"
    >
      Saltar al contenido principal
    </a>
  )
}
