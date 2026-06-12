# Definir tipografia, paleta, superficies y espaciado base: consolidar el sistema visual minimo

**Grupo:** G4.5 - Frontend base y experiencia  
**Orden:** 6  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Definir los elementos visuales base del frontend para que shell, panel, tablas, modales y vistas compartan el mismo lenguaje.

## Estado

Completado.

## Archivos

- `app/globals.css`
- `app/components/ui/`
- `docs/ARCHITECTURE.md`

## Pasos

1. Definir tipografia principal y apoyo.
2. Definir paleta base y contrastes principales.
3. Definir superficies, bordes, radios y profundidad.
4. Definir espaciado y ritmo visual base.

## Criterios de aceptacion

- El sistema visual minimo queda definido.
- La base sirve a todas las vistas del grupo.
- No se construye un design system inflado.

## Resolucion

Se definio el sistema visual minimo en `docs/architecture/07-frontend-experience.md`.

Decision:

- tipografia principal sans geometrica con personalidad contemporanea
- tipografia de apoyo mono sobria para metadata y estados tecnicos
- paleta base de fondo profundo, texto claro, planos intermedios y un acento principal controlado
- superficies diferenciadas para shell, panel lateral, contenido abierto, modal y cards puntuales
- radios controlados y profundidad contenida
- espaciado orientado a escaneo rapido y densidad moderada de producto operativo

La base queda definida para que shell, panel, tabla, modal y vistas futuras compartan el mismo lenguaje sin construir un design system inflado.

## Validacion

- Verificar legibilidad y contraste.
- Verificar consistencia entre shell, cards, tabla y modal.

## Estado final

Completado.
