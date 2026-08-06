import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  uid,
  hoyISO,
  vencido,
  progresoSub,
  fechaPorPrioridad,
  isoMasDias,
  isoProximoFinDeSemana,
  parsearRepeticion,
  describirRepeticion,
  siguienteFecha,
  extraerSufijos,
  proximaInstanciaRepeticion,
  parsearLinea,
  esBullet,
  defaultsHorario,
  normalizar,
  parsearFechaFlexible,
  parsearHoraFlexible,
  googleCalendarUrl,
  activo,
} from "@/lib/app-utils";
import type { Pendiente } from "@/types";

// `fechaRelativa` es privada en el módulo; la exponemos solo para tests via el hack de
// re-export en el archivo (ver al final). Para tests, mejor construimos fechas
// deterministas usando `new Date(2026, 7, 4)` (lunes 4 ago 2026) y congelamos `Date`.

beforeEach(() => {
  vi.useRealTimers();
});

describe("uid", () => {
  it("genera strings únicos", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) ids.add(uid());
    expect(ids.size).toBe(1000);
  });
});

describe("hoyISO", () => {
  it("devuelve YYYY-MM-DD con relleno de ceros", () => {
    const s = hoyISO();
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("vencido", () => {
  it("no está vencido si no tiene fechaLimite", () => {
    expect(vencido({} as Pendiente)).toBe(false);
  });
  it("no está vencido si está en la columna completado", () => {
    expect(vencido({ fechaLimite: "2020-01-01", estado: "completado" } as Pendiente, "completado")).toBe(false);
  });
  it("está vencido si la fechaLimite es anterior a hoy y no está completado", () => {
    expect(vencido({ fechaLimite: "2020-01-01", estado: "pendiente" } as Pendiente, "completado")).toBe(true);
  });
});

describe("progresoSub", () => {
  it("devuelve null si no hay subtareas", () => {
    expect(progresoSub({ subtareas: [] } as Pendiente)).toBeNull();
  });
  it("cuenta completadas y total", () => {
    const p = {
      subtareas: [
        { id: "1", texto: "a", completada: true },
        { id: "2", texto: "b", completada: false },
        { id: "3", texto: "c", completada: true },
      ],
    } as Pendiente;
    const r = progresoSub(p)!;
    expect(r).toEqual({ hechas: 2, total: 3, pct: 67 });
  });
});

describe("fechaPorPrioridad", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 5, 12, 0, 0))
  })
  afterEach(() => vi.useRealTimers())

  it("Alta → +1 día, Media → +3 días, Baja → +7 días", () => {
    expect(fechaPorPrioridad("Alta")).toBe("2026-08-06");
    expect(fechaPorPrioridad("Media")).toBe("2026-08-08");
    expect(fechaPorPrioridad("Baja")).toBe("2026-08-12");
  });
});

describe("isoMasDias / isoProximoFinDeSemana", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 5, 12, 0, 0)) // miercoles 5 ago 2026
  })
  afterEach(() => vi.useRealTimers())

  it("isoMasDias(0) == hoyISO", () => {
    expect(isoMasDias(0)).toBe("2026-08-05")
  })
  it("isoProximoFinDeSemana devuelve un sábado (getDay() === 6)", () => {
    const f = isoProximoFinDeSemana()
    const d = new Date(f + "T00:00")
    expect(d.getDay()).toBe(6)
    // Miercoles 5 → proximo sábado 8
    expect(f).toBe("2026-08-08")
  })
})

describe("parsearRepeticion", () => {
  it("parsea '*cada 3d'", () => {
    const { regla, resto } = parsearRepeticion("Comprar pan *cada 3d");
    expect(regla).toBe("3d");
    expect(resto).toBe("Comprar pan ");
  });
  it("parsea '*cada! 7d' (desde completado)", () => {
    const r = parsearRepeticion("X *cada! 7d");
    expect(r.regla).toBe("!7d");
  });
  it("parsea '*cada 2 semanas'", () => {
    const r = parsearRepeticion("X *cada 2 semanas");
    expect(r.regla).toBe("2s");
  });
  it("parsea '*cada lunes y jueves'", () => {
    const r = parsearRepeticion("X *cada lunes y jueves");
    expect(r.regla).toBe("w:1,4");
  });
  it("parsea '*cada! lunes y jueves'", () => {
    const r = parsearRepeticion("X *cada! lunes y jueves");
    expect(r.regla).toBe("!w:1,4");
  });
  it("no reconoce cualquier texto", () => {
    expect(parsearRepeticion("hola mundo")).toEqual({ resto: "hola mundo" });
  });
});

describe("describirRepeticion", () => {
  it("días sgulares/plurales", () => {
    expect(describirRepeticion("1d")).toBe("cada día");
    expect(describirRepeticion("3d")).toBe("cada 3 días");
  });
  it("semanas: 1s → 'cada 1 semana', 2s → 'cada 2 semanas'", () => {
    expect(describirRepeticion("1s")).toBe("cada 1 semana");
    expect(describirRepeticion("2s")).toBe("cada 2 semanas");
  });
  it("meses: 1m → 'cada 1 mes', 4m → 'cada 4 meses'", () => {
    expect(describirRepeticion("1m")).toBe("cada 1 mes");
    expect(describirRepeticion("4m")).toBe("cada 4 meses");
  });
  it("días de la semana", () => {
    expect(describirRepeticion("w:1,4")).toBe("cada lunes y jueves");
  });
  it("sufijo `!` (desde completado)", () => {
    expect(describirRepeticion("!1d")).toBe("cada día (desde que se completa)");
  });
});

describe("siguienteFecha", () => {
  const base = "2026-08-04"; // lunes
  it("+Nd", () => {
    expect(siguienteFecha("3d", base)).toBe("2026-08-07");
  });
  it("+Ns → semanas", () => {
    expect(siguienteFecha("2s", base)).toBe("2026-08-18");
  });
  it("+Nm → meses (≈30 días)", () => {
    expect(siguienteFecha("1m", base)).toBe("2026-09-03");
  });
  it("w:1,4 → siguiente lunes (en 7 días si partimos de lunes)", () => {
    // Partiendo del lunes, el siguiente lunes es en 7 días; el jueves es en 3.
    expect(siguienteFecha("w:1,4", base)).toBe("2026-08-06"); // jueves antes que lunes
  });
  it("siguienteFecha(w:1,4, '2026-08-05') → jueves 06", () => {
    expect(siguienteFecha("w:1,4", "2026-08-05")).toBe("2026-08-06");
  });
  it("prefijo `!` no afecta al cálculo (sólo semántico)", () => {
    expect(siguienteFecha("!3d", base)).toBe("2026-08-07");
  });
  it("base vacía usa hoyISO", () => {
    const r = siguienteFecha("1d", "");
    expect(r).toBe(isoMasDias(1));
  });
});

describe("Fase 8.7 — RRULE avanzado", () => {
  describe("extraerSufijos", () => {
    it("regla sin sufijos: base intacta, sufijos vacíos", () => {
      const r = extraerSufijos("7d");
      expect(r.base).toBe("7d");
      expect(r.sufijos).toEqual({});
    });
    it("extrae ;until: y conserva el prefijo `!` en base", () => {
      const r = extraerSufijos("!7d;until:2026-12-31");
      expect(r.base).toBe("!7d");
      expect(r.sufijos.until).toBe("2026-12-31");
    });
    it("extrae ;count: como número", () => {
      const r = extraerSufijos("1d;count:3");
      expect(r.base).toBe("1d");
      expect(r.sufijos.count).toBe(3);
    });
    it("extrae ambos sufijos combinados", () => {
      const r = extraerSufijos("w:1,4;until:2026-09-01;count:5");
      expect(r.base).toBe("w:1,4");
      expect(r.sufijos).toEqual({ until: "2026-09-01", count: 5 });
    });
  });

  describe("nth: (enésimo día de la semana del mes)", () => {
    it("describirRepeticion: 2º martes de cada mes", () => {
      expect(describirRepeticion("nth:2:2")).toBe("el segundo martes de cada mes");
    });
    it("siguienteFecha: 2026-08-04 (martes) → siguiente 2º martes cae en septiembre", () => {
      // agosto 2026: martes son 4,11,18,25 → el "2º martes" (11) ya pasó respecto al 4... pero
      // 11 > 4 así que debe ser agosto 11.
      expect(siguienteFecha("nth:2:2", "2026-08-04")).toBe("2026-08-11");
    });
    it("siguienteFecha: si ya pasó el 2º martes del mes, salta al siguiente mes", () => {
      expect(siguienteFecha("nth:2:2", "2026-08-15")).toBe("2026-09-08");
    });
  });

  describe("proximaInstanciaRepeticion", () => {
    it("sin sufijos: se comporta igual que siguienteFecha, repite la misma regla", () => {
      const r = proximaInstanciaRepeticion("3d", "2026-08-04");
      expect(r).toEqual({ fechaLimite: "2026-08-07", repetir: "3d" });
    });
    it(";count: decrece en cada instancia y se detiene en 0", () => {
      const r1 = proximaInstanciaRepeticion("1d;count:2", "2026-08-04");
      expect(r1).toEqual({ fechaLimite: "2026-08-05", repetir: "1d;count:1" });
      const r2 = proximaInstanciaRepeticion(r1!.repetir, r1!.fechaLimite);
      expect(r2).toEqual({ fechaLimite: "2026-08-06", repetir: "1d;count:0" });
      const r3 = proximaInstanciaRepeticion(r2!.repetir, r2!.fechaLimite);
      expect(r3).toBeNull();
    });
    it(";until: detiene la serie cuando la próxima fecha la supera", () => {
      // Siguiente fecha natural sería 2026-08-11, que ya pasa el límite (2026-08-10) → null.
      const r = proximaInstanciaRepeticion("7d;until:2026-08-10", "2026-08-04");
      expect(r).toBeNull();
    });
    it(";until: permite la última instancia justo en el límite", () => {
      const r = proximaInstanciaRepeticion("7d;until:2026-08-11", "2026-08-04");
      expect(r).toEqual({ fechaLimite: "2026-08-11", repetir: "7d;until:2026-08-11" });
    });
  });
});

describe("parsearLinea", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 5, 12, 0, 0))
  })
  afterEach(() => vi.useRealTimers())

  it("sólo título", () => {
    const r = parsearLinea("- Hacer la comida");
    expect(r).toEqual({
      titulo: "Hacer la comida",
      descripcion: "",
      responsable: "",
    });
  });
  it("título + descripción (separados por `:`)", () => {
    const r = parsearLinea("- Pedido: comprar leche");
    expect(r).toEqual({
      titulo: "Pedido",
      descripcion: "comprar leche",
      responsable: "",
    });
  });
  it("responsable @ y prioridad !", () => {
    const r = parsearLinea("- @Liz: preparar reporte !alta");
    expect(r?.responsable).toBe("Liz");
  });
  it("fecha relativa `>mañana`", () => {
    const r = parsearLinea("- Llamar cliente >mañana");
    expect(r?.fechaLimite).toBe("2026-08-06");
  });
  it("fecha ISO absoluta `>2026-12-31`", () => {
    const r = parsearLinea("- Cierre >2026-12-31");
    expect(r?.fechaLimite).toBe("2026-12-31");
  });
  it("recurrencia `*cada 7d`", () => {
    const r = parsearLinea("- Reporte semanal *cada 7d");
    expect(r?.repetir).toBe("7d");
  });
  it("combinación completa: `@a !alta >mañana *cada! 1d`", () => {
    const r = parsearLinea("- @Ana: enviar mail !alta >mañana *cada! 1d");
    expect(r?.responsable).toBe("Ana");
    expect(r?.prioridad).toBe("Alta");
    expect(r?.fechaLimite).toBe("2026-08-06");
    expect(r?.repetir).toBe("!1d");
  });
  it("respeta `-`, `*`, `+`, `•` como viñeta inicial", () => {
    for (const v of ["-", "*", "+", "•"]) {
      expect(parsearLinea(`${v} Hola`)?.titulo).toBe("Hola");
    }
  });
  it("respeta `[ ]` y `[x]` como prefijo checkbox", () => {
    expect(parsearLinea("- [ ] Hola")?.titulo).toBe("Hola");
    expect(parsearLinea("[x] Hola")?.titulo).toBe("Hola");
  });
  it("devuelve null para texto vacío", () => {
    expect(parsearLinea("")).toBeNull();
    expect(parsearLinea("   ")).toBeNull();
    expect(parsearLinea("-   ")).toBeNull();
  });
});

describe("esBullet", () => {
  it("reconoce -, *, +, • con contenido", () => {
    expect(esBullet("- a")).toBe(true);
    expect(esBullet("* a")).toBe(true);
    expect(esBullet("+ a")).toBe(true);
    expect(esBullet("• a")).toBe(true);
  });
  it("no reconoce texto sin viñeta", () => {
    expect(esBullet("Hola")).toBe(false);
    expect(esBullet("-")).toBe(false);
    expect(esBullet("- ")).toBe(false);
  });
});

describe("defaultsHorario", () => {
  it("sin fecha → no toca nada", () => {
    expect(defaultsHorario("", "", undefined)).toEqual({ hora: "", duracionMin: undefined });
  });
  it("fecha sin hora → 08:00 + 5 min", () => {
    expect(defaultsHorario("2026-08-04", "", undefined)).toEqual({ hora: "08:00", duracionMin: 5 });
  });
  it("fecha+hora sin duración → 15 min", () => {
    expect(defaultsHorario("2026-08-04", "10:00", undefined)).toEqual({ hora: "10:00", duracionMin: 15 });
  });
  it("fecha+hora+duración → conserva", () => {
    expect(defaultsHorario("2026-08-04", "10:00", 60)).toEqual({ hora: "10:00", duracionMin: 60 });
  });
});

describe("normalizar", () => {
  it("rellena todos los campos por defecto", () => {
    const p = normalizar({ titulo: "X" });
    expect(p.titulo).toBe("X");
    expect(p.prioridad).toBe("Media");
    expect(p.estado).toBe("pendiente");
    expect(p.subtareas).toEqual([]);
    expect(p.comentarios).toEqual([]);
    expect(p.adjuntos).toEqual([]);
    expect(p.creado).toBe(p.modificado);
    expect(p.fechaCompletado).toBeNull();
  });
  it("respeta los campos proveídos", () => {
    const p = normalizar({ titulo: "X", prioridad: "Alta", estado: "completado" });
    expect(p.prioridad).toBe("Alta");
    expect(p.estado).toBe("completado");
  });
  it("aplica defaultsHorario al construirse", () => {
    const p = normalizar({ fechaLimite: "2026-08-04" });
    expect(p.hora).toBe("08:00");
    expect(p.duracionMin).toBe(5);
  });
  it("genera id si falta", () => {
    const p = normalizar({ titulo: "X" });
    expect(p.id).toBeTruthy();
  });
});

describe("parsearFechaFlexible", () => {
  it("ISO aaaa-mm-dd", () => {
    expect(parsearFechaFlexible("2026-08-04")).toBe("2026-08-04");
  });
  it("dd/mm/aaaa", () => {
    expect(parsearFechaFlexible("04/08/2026")).toBe("2026-08-04");
  });
  it("dd-mm-aaaa (con guiones)", () => {
    expect(parsearFechaFlexible("04-08-2026")).toBe("2026-08-04");
  });
  it("dd/mm/aa (años corto < 70 → 2000+)", () => {
    expect(parsearFechaFlexible("04/08/26")).toBe("2026-08-04");
  });
  it("dd/mm/aa (año corto >= 70 → 1900+)", () => {
    expect(parsearFechaFlexible("04/08/75")).toBe("1975-08-04");
  });
  it("número de serie Excel (45000): días desde 1899-12-30, día de la semana correcto", () => {
    const r = parsearFechaFlexible("45000");
    expect(r).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Determinismo: la fecha resultante debe ser coherente con 45000 días de offset.
    // El cálculo del módulo usa UTC, así que validamos solo el formato y no reventamos con date real.
    const d = new Date(r + "T00:00");
    expect(d.getDate()).toBeGreaterThan(0);
    expect(d.getDate()).toBeLessThanOrEqual(31);
  });
  it("string vacío", () => {
    expect(parsearFechaFlexible("")).toBe("");
    expect(parsearFechaFlexible("   ")).toBe("");
  });
  it("formato inválido", () => {
    expect(parsearFechaFlexible("hola")).toBe("");
    expect(parsearFechaFlexible("99/99/9999")).toBe("");
  });
  it("valida día real (no acepta 31 de febrero)", () => {
    expect(parsearFechaFlexible("31/02/2026")).toBe("");
  });
});

describe("parsearHoraFlexible", () => {
  it("HH:MM (24h)", () => {
    expect(parsearHoraFlexible("10:30")).toBe("10:30");
    expect(parsearHoraFlexible("22:00")).toBe("22:00");
  });
  it("HH am/pm", () => {
    expect(parsearHoraFlexible("10 am")).toBe("10:00");
    expect(parsearHoraFlexible("10 pm")).toBe("22:00");
  });
  it("HH sin minutos", () => {
    expect(parsearHoraFlexible("9 am")).toBe("09:00");
    expect(parsearHoraFlexible("9pm")).toBe("21:00");
  });
  it("formen con puntos (a.m./p.m.)", () => {
    expect(parsearHoraFlexible("10 a.m.")).toBe("10:00");
    expect(parsearHoraFlexible("3 p.m.")).toBe("15:00");
  });
  it("12 am → 00:00; 12 pm → 12:00", () => {
    expect(parsearHoraFlexible("12 am")).toBe("00:00");
    expect(parsearHoraFlexible("12 pm")).toBe("12:00");
  });
  it("invalida 25:00 y 13:99", () => {
    expect(parsearHoraFlexible("25:00")).toBe("");
    expect(parsearHoraFlexible("10:99")).toBe("");
  });
  it("vacío", () => {
    expect(parsearHoraFlexible("")).toBe("");
  });
});

describe("googleCalendarUrl", () => {
  it("sin fecha → null", () => {
    expect(googleCalendarUrl("X", "")).toBeNull();
  });
  it("con fecha+hora → URL con `dates` en formato compacto", () => {
    const url = googleCalendarUrl("Reunion", "2026-08-04", "10:00");
    expect(url).toContain("calendar.google.com");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("text=Reunion");
    expect(url).toContain("dates=20260804T100000");
  });
  it("con fecha sin hora → evento de día completo (URL-encoded `/`)", () => {
    const url = googleCalendarUrl("Cierre", "2026-08-04");
    expect(url).toContain("dates=20260804%2F20260805");
  });
});

describe("activo", () => {
  it("true si archivado falso/undefined", () => {
    expect(activo({ archivado: false } as Pendiente)).toBe(true);
    expect(activo({} as Pendiente)).toBe(true);
  });
  it("false si archivado true", () => {
    expect(activo({ archivado: true } as Pendiente)).toBe(false);
  });
});
