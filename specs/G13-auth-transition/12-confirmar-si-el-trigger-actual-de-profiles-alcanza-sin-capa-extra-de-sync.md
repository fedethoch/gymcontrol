# Confirmar si el trigger actual de profiles alcanza sin capa extra de sync: reutilizar el modelo de usuario actual antes de agregar complejidad

**Grupo:** G13 - Transicion de auth dual  
**Orden:** 12  
**Esfuerzo:** Bajo  
**Modelo recomendado:** gpt 5.4 mini

## Objetivo

Verificar si el trigger actual que crea `profiles` al alta en `auth.users` alcanza para OTP y Google, evitando agregar una capa de sincronizacion que el proyecto no necesite.

## Estado

Pendiente.

## Archivos

- `docs/DATABASE.md`
- migracion base de G2
- implementacion de auth nueva

## Pasos

1. Revisar el comportamiento del trigger actual.
2. Confirmar su compatibilidad con OTP.
3. Confirmar su compatibilidad con Google OAuth.
4. Solo si falla, definir una capa minima de sync adicional.

## Criterios de aceptacion

- Se sabe si el trigger actual alcanza o no.
- No se agrega sincronizacion extra sin motivo real.
- `profiles` sigue siendo suficiente como tabla de app.

## Resolucion

Completar al ejecutar este paso.

## Validacion

- Verificar que un usuario nuevo por OTP o Google obtenga perfil.
- Verificar que la conclusion quede reflejada en `docs/DATABASE.md` si cambia algo operativo.

## Estado final

No iniciado.
