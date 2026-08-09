import * as React from "react"

import { cn } from "@/lib/utils"

/** Primitiva de superficie única (PDS.md §6.7): reemplaza los `rounded-xl/lg/2xl border
    bg-card` repetidos a mano por toda la app. `interactive` agrega la elevación de hover
    (`ease-smooth`, PDS.md §7.2) para tarjetas clickeables — no se aplica por defecto porque
    la mayoría de los usos son contenedores estáticos (paneles, secciones), no tarjetas. */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card",
        interactive &&
          "cursor-pointer transition-transform duration-150 ease-smooth hover:-translate-y-px hover:shadow-soft-lg",
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = "Card"

export { Card }
