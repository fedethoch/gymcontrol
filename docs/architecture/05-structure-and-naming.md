# Estructura de carpetas

La estructura inicial del proyecto debe ser simple, predecible y alineada con el MVP.

### Estructura base recomendada

```text
app/
  admin/
  catalogo/
  dashboard/
  auth/
  components/
  globals.css
  layout.tsx
docs/
public/
specs/
```

### Significado de cada area

- `app/`: rutas, vistas y layout principal del producto
- `app/admin/`: vistas del admin dashboard
- `app/catalogo/`: vistas del catalogo de rutinas
- `app/dashboard/`: vistas del dashboard de usuario
- `app/auth/`: vistas o flujo de acceso
- `app/components/`: componentes compartidos reutilizables
- `docs/`: documentos de referencia del proyecto
- `public/`: assets publicos como imagenes o recursos estaticos
- `specs/`: pasos ejecutables y documentos de contexto por grupo

### Subestructura sugerida dentro de `app/`

```text
app/
  admin/
    ejercicios/
    rutinas/
  catalogo/
    rutinas/
  dashboard/
    rutinas/
  auth/
    login/
```

### Subestructura sugerida dentro de `components/`

```text
app/components/
  ui/
  shared/
  exercises/
  routines/
  modals/
```

### Subestructura sugerida dentro de `docs/`

```text
docs/
  ARCHITECTURE.md
  DATABASE.md
  SKILLS_AND_AGENTS.md
```

## Convenciones de nombres

### Carpetas

- usar minusculas
- usar nombres descriptivos
- evitar abreviaciones poco claras
- preferir nombres funcionales antes que tecnicos

### Archivos de componentes

- usar `PascalCase` para componentes React
- usar nombres descriptivos y directos
- evitar nombres genericos como `Item`, `Box` o `Panel` si no agregan claridad

### Archivos de pagina o vista

- usar nombres coherentes con la ruta
- mantener los archivos de pagina simples y previsibles

### Archivos de utilidad o logica

- usar `camelCase` o `kebab-case` segun el estandar del proyecto
- preferir nombres que describan accion o responsabilidad

### Regla general de naming

- si una carpeta o archivo se puede entender rapido, el nombre esta bien
- si obliga a leer contexto extra para entenderlo, el nombre debe simplificarse

## Regla de orden

El repositorio debe priorizar:

- primero la funcion del producto
- despues la organizacion interna
- despues las abstracciones compartidas

No se deben crear carpetas solo por anticipacion teorica.
