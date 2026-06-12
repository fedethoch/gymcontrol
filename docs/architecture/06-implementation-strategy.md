# Estrategia de implementacion

La implementacion del MVP debe seguir un patron simple y repetible para no mezclar responsabilidades entre vistas, acciones y validaciones.

### Vistas y componentes

### Vistas

- cada ruta o pantalla debe enfocarse en una responsabilidad clara
- las vistas orquestan la experiencia y conectan con la logica necesaria
- las vistas pueden componer componentes compartidos, pero no deben contener reglas de negocio complejas
- en G4 el esqueleto navegable fija las rutas base de `auth`, `catalogo`, `dashboard` y `admin` antes de sumar logica funcional

### Componentes compartidos

- los componentes compartidos deben ser reutilizables y presentacionales
- un componente compartido no debe conocer detalles de persistencia
- si una pieza visual se repite en mas de una vista, debe evaluarse como componente compartido

### Base visual compartida

- `app/globals.css` concentra tokens y reglas visuales globales del MVP
- `app/layout.tsx` sostiene el shell comun y la navegacion primaria entre modulos
- `app/components/ui/` contiene primitivas presentacionales cortas y reutilizables
- `app/components/shared/` concentra piezas transversales como la navegacion compartida
- a partir de G4.5 el shell objetivo se basa en panel lateral izquierdo y area principal de trabajo
- la UI compartida debe resolver layout, superficies y elementos de apoyo antes que variantes complejas
- no se debe construir un design system completo en G4; solo la base necesaria para evitar estilos improvisados

### Acciones y logica de aplicacion

- las acciones de lectura y escritura deben vivir cerca del caso de uso que resuelven
- la logica de aplicacion debe centralizar flujos como crear ejercicio, crear rutina, guardar rutina y renombrar rutina
- las acciones sensibles deben validar autenticacion y rol antes de escribir
- la UI solo dispara la accion; la decision funcional no debe quedar en el componente visual

### Acceso a datos y entorno

- la configuracion compartida de Supabase vive en `app/lib/supabase/`
- las variables requeridas del MVP son `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- la validacion de entorno debe ocurrir en una utilidad comun antes de crear clientes
- en G4 se deja lista la creacion de clientes de navegador y servidor, pero el proxy de refresco de sesion queda diferido a G5 junto con auth

### Validaciones

- la validacion debe ocurrir antes de persistir
- los formularios y acciones deben validar campos requeridos, formatos basicos e integridad minima
- las validaciones deben devolver mensajes claros y consistentes
- si un dato es sensible, la validacion no puede existir solo en la interfaz

### Reglas para compartir logica

- si una misma regla se usa en varias vistas, debe moverse a una utilidad o capa comun simple
- si la logica pertenece a un caso de uso concreto, debe permanecer junto a ese flujo
- no se deben crear helpers o abstractions compartidas sin una necesidad repetida real

### Regla de implementacion recomendada

- usar vistas para orquestar
- usar componentes para reutilizar UI
- usar acciones o logica para flujos de negocio
- usar validaciones para asegurar datos
- usar persistencia para leer y escribir

### Criterio de simplicidad

Si surge duda entre dos opciones, se debe elegir la que:

- sea mas facil de entender rapido
- requiera menos piezas
- mantenga el control de permisos en la capa correcta
- permita avanzar sin rehacer la estructura luego

## Cierre de arquitectura

Este documento consolida la arquitectura pactada para el MVP de GymControl y funciona como fuente de verdad para decisiones futuras.

Todo cambio posterior que afecte alcance, modulos, flujos, capas, estructura o convenciones debe reflejarse aqui antes de considerarse parte estable del proyecto.

## Nota

Este documento se ampliara en los siguientes pasos del grupo `G1` para definir modulos, fronteras, flujos y convenciones tecnicas.
