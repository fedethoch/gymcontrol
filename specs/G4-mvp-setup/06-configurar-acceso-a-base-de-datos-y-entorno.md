# Configurar acceso a base de datos y entorno: preparar la conexion tecnica del proyecto

**Grupo:** G4 - Setup tecnico del MVP  
**Orden:** 6  
**Esfuerzo:** Medio  
**Modelo recomendado:** gpt 5.4

## Objetivo

Configurar la base tecnica necesaria para conectar la aplicacion con la base de datos y manejar variables de entorno del MVP de forma ordenada.

## Estado

Completado.

## Archivos

- archivos de entorno del proyecto
- configuracion de acceso a datos
- `docs/DATABASE.md`
- `docs/ARCHITECTURE.md`

## Pasos

1. Tomar la estrategia de base de datos definida.
2. Configurar acceso a datos de forma minima y consistente con la arquitectura.
3. Preparar manejo de variables de entorno necesarias.
4. Evitar configuraciones avanzadas no requeridas por el MVP.
5. Dejar una base confiable para lectura y escritura futuras.

## Criterios de aceptacion

- La app tiene una base de conexion a datos definida.
- Las variables de entorno necesarias quedan identificadas y ordenadas.
- La configuracion no sobrecomplica el proyecto.

## Resolucion

Se preparo una capa minima de acceso a Supabase en `app/lib/supabase/` con validacion de entorno comun y clientes separados para navegador y servidor.

Tambien se dejo un `.env.example` versionable con las variables publicas requeridas por la app para no depender de nombres implicitos ni configuraciones ad hoc.

La parte de proxy para refresco de sesion se difiere a G5 porque en G4 todavia no corresponde activar auth ni proteccion de rutas.

## Validacion

- Verificar que la configuracion permita avanzar luego con auth, ejercicios y rutinas.
- Verificar que no dependa de supuestos no documentados.

## Estado final

Completado.
