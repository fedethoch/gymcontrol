# Frontend Experience

Este documento registra las decisiones de experiencia frontend del MVP a partir de `G4.5`.

## Principio de experiencia

GymControl debe sentirse como una herramienta de trabajo personal y administrativa, no como una landing.

La primera pantalla util debe ser un panel operativo con navegacion clara, acceso rapido a rutinas y lectura directa del entrenamiento activo.

## Visual thesis

Interfaz minimalista, precisa y moderna, con energia de producto operativo: panel lateral sobrio, contenido amplio, jerarquia fuerte y pocas superficies decorativas.

## Estado implementado en G4.5

La implementacion base ya aterrizo estas decisiones:

- se usan primitivas de `shadcn/ui` como base del sistema de interfaz
- el shell ocupa el viewport completo y prioriza una experiencia de app, no de landing contenida
- el sidebar desktop puede colapsarse sin perder orientacion
- en mobile la navegacion lateral se resuelve con `Sheet`
- las superficies principales son opacas y legibles
- se descarto el tratamiento de glassmorphism y la grilla decorativa del rediseño previo
- la validacion tecnica cerrada de esta etapa fue `pnpm lint`, `pnpm build` y smoke HTTP local; la verificacion visual en browser queda como complemento cuando el plugin este disponible

## Direccion visual general

La direccion visual del MVP sera una interfaz operativa premium: limpia, enfocada, con densidad moderada y pensada para uso repetido.

Sensacion buscada:

- herramienta personal de entrenamiento, no landing comercial
- moderna y minimalista, pero no vacia
- energica por jerarquia, contraste y ritmo, no por decoracion excesiva
- apta para usuario y admin sin cambiar de identidad visual

Composicion:

- panel lateral izquierdo como ancla visual estable
- area principal amplia, clara y orientada a la tarea actual
- encabezados funcionales, breves y escaneables
- secciones sin tratamiento de card cuando el layout alcance
- cards solo para items repetidos, modales o herramientas realmente enmarcadas

Jerarquia:

- la vista activa debe leerse primero
- la accion principal de cada pantalla debe estar cerca del contenido que afecta
- estados como rutina activa, dia de entrenamiento y descanso deben distinguirse rapido
- admin debe sentirse como una capa de gestion, no como otro producto

Color y atmosfera:

- evitar una UI dominada por un solo color
- evitar dependencia de gradientes decorativos como identidad principal
- usar una base neutra con contraste alto y un acento claro para accion o estado
- reservar colores secundarios para estados funcionales como activo, descanso, alerta o exito

Movimiento:

- usar movimiento solo para orientar cambios de estado
- priorizar transiciones de panel, cambio de vista, apertura de modal y feedback hover
- evitar animaciones ornamentales que no ayuden a navegar o decidir

Lenguaje visual:

- no usar hero sections para pantallas internas
- no usar mosaicos de cards como estructura dominante
- no usar copy aspiracional cuando la pantalla debe ayudar a operar
- no esconder informacion relevante detras de decoracion visual

La identidad debe sostener estas pantallas:

- catalogo de rutinas
- rutinas guardadas
- rutina activa y organigrama semanal
- detalle diario en tabla
- modal de ejercicio
- gestion admin de rutinas y ejercicios

La implementacion visual debe poder crecer hacia G5-G10 sin rehacer shell, navegacion ni patrones principales.

## Sistema visual minimo

El sistema visual base del MVP debe ser corto, consistente y suficiente para shell, panel, tablas, modales y vistas operativas.

### Tipografia

Tipografia principal:

- sans geometrica con personalidad contemporanea
- pensada para encabezados funcionales, navegacion y lectura corta
- debe sentirse precisa y moderna, no editorial ni corporativa generica

Tipografia de apoyo:

- mono sobria para etiquetas tecnicas, estados, metadata breve o datos auxiliares
- uso limitado, nunca como tipografia dominante de pantalla

Reglas:

- maximo dos familias tipograficas
- encabezados con peso claro pero sin exagerar escala
- texto de interfaz compacto, legible y estable
- evitar contrastes tipograficos teatrales

### Paleta

Base cromatica:

- fondo profundo y neutro con atmosfera fria
- planos intermedios algo mas claros para separar panel y contenido
- texto principal muy claro para contraste alto
- texto secundario mas apagado para soporte y estados menos prioritarios

Acentos:

- un acento principal claro para seleccion, foco y accion
- color de exito separado para feedback positivo
- colores de alerta y descanso quedan reservados para estados funcionales posteriores

Reglas:

- evitar interfaces monocromaticas planas
- evitar una identidad basada solo en azul oscuro y celeste repetidos sin contraste de superficie
- evitar que el acento compita con la lectura del contenido

### Superficies

Tipos de superficie:

- shell general como contenedor principal
- panel lateral como superficie estable de navegacion
- contenido principal como superficie abierta y menos enmarcada
- modal como superficie fuerte y enfocada
- cards solo para elementos repetidos o herramientas puntuales

Tratamiento:

- bordes finos y discretos
- contraste de superficie antes que sombras pesadas
- profundidad contenida, nunca teatral
- superficies mayormente opacas; evitar blur, glass o transparencias como lenguaje dominante

Radios:

- shell con radio amplio pero controlado
- cards y modales con radios menores
- evitar curvas excesivamente blandas en una interfaz operativa

### Espaciado

Ritmo base:

- separacion clara entre shell, navegacion y contenido
- bloques internos con espaciado suficiente para escaneo rapido
- tablas, listas y paneles con densidad moderada, no aire de landing

Reglas:

- usar multiples de espaciado consistentes
- privilegiar alineacion y ritmo antes que decoracion
- mantener patrones repetibles entre usuario y admin
- asegurar que mobile conserve claridad sin convertir todo en tarjetas grandes

### Resultado esperado del sistema base

La combinacion de tipografia, paleta, superficies y espaciado debe producir:

- una herramienta operativa clara
- una identidad visual moderna y propia
- un shell estable para crecer
- coherencia entre catalogo, rutinas guardadas, ejercicio, admin, tabla y modal

## Content plan

- Shell persistente: orienta al usuario y mantiene acceso a las areas principales.
- Area de contenido: muestra la vista activa sin competir con el panel.
- Vista secundaria o detalle: aparece como pagina enfocada o modal segun el tipo de consulta.
- Acciones: quedan visibles cerca del contexto donde se usan.

## Interaction thesis

- El panel lateral puede desplegarse o compactarse sin perder orientacion.
- La navegacion debe marcar con claridad la seccion activa.
- El modal de ejercicio debe abrirse sobre la rutina sin sacar al usuario de contexto.

## Shell principal

La app usara un shell unico para usuario y admin.

Estructura base:

```text
app shell
  left sidebar
    brand/status
    user navigation
    admin entry when role allows it
    session/access area
  main workspace
    contextual header
    active view content
    modal layer when needed
```

## Panel lateral izquierdo

El panel lateral izquierdo es la pieza persistente de navegacion del producto.

Responsabilidades:

- contener la navegacion principal
- indicar la seccion activa
- separar entradas de usuario y admin
- sostener acciones de acceso o sesion cuando G5 las implemente
- permitir que el area principal se concentre en la tarea actual

Entradas base de usuario:

- `Agregar rutinas`
- `Mis rutinas`
- `Ejercicio`

Entrada base admin:

- `Admin dashboard`

La entrada admin vive en el mismo shell, dentro del mismo bloque de navegacion lateral. G5 solo va a controlar si se muestra o se habilita segun rol, sin crear una navegacion paralela.

## Patron visual del panel y contenido

El shell debe organizarse como una composicion de dos regiones principales:

- panel lateral izquierdo
- area principal de contenido

### Panel lateral

Rol visual:

- ancla estable de navegacion y orientacion
- superficie mas definida que el contenido
- lectura vertical clara y compacta

Composicion:

- bloque superior para marca o estado
- bloque central para navegacion principal
- bloque inferior para sesion, acceso o acciones secundarias

Dimension base:

- en desktop debe ocupar una franja fija o casi fija
- ancho visual recomendado: estrecho pero suficiente para etiqueta e iconografia
- no debe competir en peso visual con el contenido principal

Comportamiento:

- estado expandido por defecto en desktop
- estado compactado permitido si la implementacion lo justifica
- en mobile debe convertirse en drawer superpuesto

Reglas:

- la navegacion debe poder escanearse en una sola columna
- la seccion activa debe distinguirse rapido por contraste y ritmo, no por decoracion excesiva
- el panel puede tener mas contraste de superficie que el contenido, pero menos protagonismo que la vista activa

### Area principal de contenido

Rol visual:

- region dominante del producto
- foco principal de lectura, accion y consulta
- superficie mas abierta y menos encerrada que el panel

Composicion:

- encabezado contextual breve
- contenido principal con ancho legible
- espacio suficiente para tablas, listados, organigramas y modales

Reglas:

- el contenido no debe sentirse comprimido por el panel
- la vista activa debe tener mas aire y amplitud que la navegacion
- el encabezado contextual no debe convertirse en hero
- cuando haya detalle diario o tablas, el contenido debe priorizar lectura horizontal controlada

### Relacion visual entre ambas regiones

La relacion entre panel y contenido debe transmitir:

- estabilidad en navegacion
- protagonismo de la tarea actual
- separacion clara sin dividir la app en dos productos

Patron esperado:

- panel mas oscuro o mas denso
- contenido principal mas respirable
- separacion por contraste de superficie, borde o espaciado
- shell general como contenedor unico que envuelve ambas regiones

### Estados del patron

Desktop:

- panel visible de forma persistente
- contenido siempre disponible junto al panel

Desktop compacto:

- panel reduce su ancho o informacion secundaria
- el contenido gana espacio sin perder orientacion

Mobile:

- panel fuera de canvas hasta abrirse en un `Sheet`
- contenido ocupa el ancho principal
- al abrir panel, el contexto sigue claro y recuperable

### Criterio de legibilidad

El patron es correcto si:

- el usuario entiende donde esta sin leer demasiado
- el contenido principal domina la atencion
- el panel orienta sin robar foco
- la estructura puede sostener usuario, admin, tabla y modal sin hacks posteriores

## Navegacion base

La navegacion principal vive en el panel lateral izquierdo y se organiza por responsabilidad funcional, no por estructura tecnica de rutas.

### Usuario

Entradas visibles para un usuario normal:

- `Agregar rutinas`
- `Mis rutinas`
- `Ejercicio`

`Agregar rutinas` apunta al catalogo de rutinas disponibles. Su responsabilidad es permitir explorar rutinas creadas por admin y preparar la accion futura de guardarlas.

`Mis rutinas` apunta a las rutinas guardadas por el usuario. Su responsabilidad es mostrar rutinas propias, permitir identificar la rutina activa y preparar acciones futuras de renombrado o cambio de rutina activa.

`Ejercicio` apunta a la lectura semanal de la rutina activa. Su responsabilidad es mostrar los dias de la semana y distinguir entrenamiento asignado o descanso.

### Admin

Entrada visible para usuarios con rol admin:

- `Admin dashboard`

`Admin dashboard` concentra las entradas de gestion administrativa:

- crear rutina
- modificar rutinas existentes
- agregar ejercicios
- modificar ejercicios

El admin no pierde las entradas de usuario. El rol admin agrega capacidades, no reemplaza la experiencia base.

### Acceso y sesion

El area de acceso o sesion vive en una zona secundaria del panel lateral.

Responsabilidades actuales:

- mostrar estado de sesion
- permitir login por OTP por email, alternativa Google OAuth y logout
- servir como punto de apoyo para redirecciones por auth y rol

### Reglas de visibilidad

Con G5 implementado:

- usuarios no autenticados solo deben ver rutas publicas o acceso
- usuarios `user` deben ver entradas de usuario
- usuarios `admin` deben ver entradas de usuario y entrada admin
- las protecciones reales viven fuera de la UI, con guards server-side

### Estado activo

La navegacion debe marcar la seccion activa a partir de la ruta actual.

Reglas:

- una ruta hija mantiene activa su seccion principal
- el detalle diario mantiene activa la seccion `Ejercicio`
- pantallas administrativas mantienen activa la seccion `Admin dashboard`
- el modal de ejercicio no cambia la seccion activa

## Mapa de vistas y transiciones

Este mapa define como se recorre el frontend del MVP. Las rutas exactas pueden ajustarse en implementacion si Next.js lo requiere, pero la experiencia debe conservar estas transiciones.

### Vistas de usuario

Vista: `Agregar rutinas`

- entrada desde panel lateral
- muestra rutinas disponibles creadas por admin
- permite entrar al detalle de una rutina disponible
- prepara accion futura de guardar rutina

### Pantalla `Agregar rutinas`

La pantalla `Agregar rutinas` es la puerta de entrada al catalogo del producto.

Objetivo:

- permitir explorar rutinas disponibles
- ayudar a comparar rapidamente opciones
- ofrecer una entrada clara al detalle de cada rutina

Estructura principal:

- encabezado breve de contexto
- bloque principal con listado de rutinas disponibles
- estado vacio claro cuando no haya rutinas publicadas

Patron de presentacion:

- lista o grilla contenida de rutinas, segun lo que mejor preserve escaneo
- cada rutina debe resumir informacion minima util
- la tarjeta o item de rutina debe conducir al detalle, no resolver todo en la vista inicial

Informacion minima visible por rutina:

- nombre de la rutina
- descripcion corta o resumen si existe
- pista estructural breve, como cantidad de dias o enfoque general, cuando ese dato exista

Jerarquia:

- la rutina disponible es la unidad principal de lectura
- la accion dominante es entrar al detalle
- la accion de guardar queda preparada, pero no debe robar protagonismo en esta fase

Reglas:

- no mezclar rutinas ya guardadas por el usuario en esta pantalla
- no convertir la pantalla en detalle expandido de todas las rutinas a la vez
- no ocultar el acceso al detalle detras de interacciones ambiguas
- no resolver aqui la logica final de guardado

Resultado esperado:

- el usuario entiende que esta viendo el catalogo general
- puede identificar rapidamente opciones disponibles
- sabe como entrar al detalle antes de decidir guardar una rutina

Vista: `Detalle de rutina disponible`

- entrada desde `Agregar rutinas`
- muestra estructura semanal de la rutina
- permite volver a `Agregar rutinas`
- permite abrir modal de ejercicio desde filas de rutina
- prepara accion futura de guardar rutina en cuenta

Vista: `Mis rutinas`

- entrada desde panel lateral
- muestra rutinas guardadas por el usuario
- permite seleccionar rutina activa
- prepara accion futura de renombrar rutina guardada

### Pantalla `Mis rutinas`

La pantalla `Mis rutinas` es la vista personal de posesion y gestion basica de rutinas guardadas.

Objetivo:

- mostrar claramente que rutinas ya pertenecen al usuario
- distinguir cual rutina esta activa
- permitir cambiar la rutina activa sin confundir esa accion con explorar catalogo

Estructura principal:

- encabezado breve de contexto
- bloque de rutina activa o estado cuando no exista
- listado de rutinas guardadas del usuario

Patron de presentacion:

- la rutina activa debe tener una señal visual inmediata y estable
- el resto de las rutinas guardadas debe leerse como opciones disponibles para activar o gestionar
- la vista debe soportar multiples rutinas sin verse como una grilla de marketing

Informacion minima visible por rutina guardada:

- nombre visible de la rutina guardada
- referencia breve a la plantilla o estructura cuando ayude a orientarse
- estado de activa o inactiva

Jerarquia:

- la rutina activa es el foco principal de lectura
- la accion dominante es seleccionar o cambiar rutina activa
- acciones futuras de renombrado quedan como soporte, no como protagonismo principal

Reglas:

- no mezclar aqui el catalogo completo de rutinas disponibles
- no resolver el organigrama semanal dentro de esta vista
- no convertir el cambio de rutina activa en una accion confusa o escondida
- no tratar todas las rutinas guardadas como iguales si una de ellas esta activa

Resultado esperado:

- el usuario entiende rapidamente que rutinas tiene guardadas
- identifica sin duda cual rutina esta activa
- sabe como cambiar la rutina activa antes de pasar a `Ejercicio`

Vista: `Ejercicio`

- entrada desde panel lateral
- muestra organigrama semanal de la rutina activa
- cada dia muestra entrenamiento asignado o descanso
- un dia de descanso no navega a detalle
- un dia de entrenamiento abre la vista de detalle diario

### Pantalla `Ejercicio`

La pantalla `Ejercicio` es la vista semanal de ejecucion o lectura del entrenamiento activo.

Objetivo:

- traducir la rutina activa a una lectura simple por dias de la semana
- permitir saber rapido si toca entrenar o descansar
- conducir al detalle diario solo cuando corresponde

Estructura principal:

- encabezado breve de contexto
- bloque principal con los siete dias de la semana
- estado claro cuando no haya rutina activa

Patron de presentacion:

- cada dia debe verse como una unidad clara dentro del organigrama semanal
- el conjunto semanal debe poder escanearse de un vistazo
- la vista debe priorizar lectura inmediata por encima de detalle tecnico profundo

Representacion de dia de entrenamiento:

- nombre del dia de la semana
- nombre breve del entrenamiento asignado, por ejemplo `Pecho` o `Pierna`
- señal visual de que existe detalle navegable

Representacion de dia de descanso:

- nombre del dia de la semana
- estado de descanso claro y no ambiguo
- sin affordance de navegacion al detalle diario

Jerarquia:

- la semana completa es el marco principal
- el estado de cada dia debe entenderse antes que cualquier metadata secundaria
- los dias con entrenamiento deben destacar frente a los dias de descanso sin romper la calma visual

Interaccion:

- un dia de entrenamiento entra al detalle diario de rutina
- un dia de descanso no abre vista nueva
- la pantalla no debe intentar mostrar la tabla completa de todos los dias a la vez

Reglas:

- no mezclar aqui la gestion de rutinas guardadas
- no convertir esta vista en el detalle diario mismo
- no ocultar el estado de descanso detras de iconografia ambigua
- no depender de logica compleja para que la lectura semanal se entienda

Resultado esperado:

- el usuario entiende en segundos que le toca cada dia
- distingue con claridad entrenamiento y descanso
- sabe cuando puede entrar al detalle diario y cuando no

Vista: `Detalle diario de rutina`

- entrada desde un dia de entrenamiento en `Ejercicio`
- muestra solo la rutina correspondiente a ese dia
- incluye boton de volver a `Ejercicio`
- muestra la rutina en formato de tabla pactado
- permite abrir modal de ejercicio desde cada ejercicio de la tabla

### Pantalla `Detalle diario de rutina`

La pantalla de detalle diario es la vista de foco mas alto del flujo de entrenamiento del usuario.

Objetivo:

- mostrar solo el entrenamiento correspondiente al dia seleccionado
- eliminar ruido de navegacion secundaria o contenido no relacionado
- sostener la tabla como pieza principal de lectura y accion

Estructura principal:

- boton de volver visible y claro
- encabezado breve con referencia al dia o entrenamiento
- tabla de ejercicios como bloque dominante

Patron de presentacion:

- la pantalla debe sentirse mas enfocada que `Ejercicio`
- la tabla ocupa el protagonismo visual
- el resto de la interfaz acompaña sin competir

Boton de volver:

- vive en la parte superior del contenido
- devuelve a la pantalla `Ejercicio`
- debe preservar el contexto de lectura semanal del usuario

Jerarquia:

- primero se entiende a que dia o entrenamiento corresponde la vista
- despues se lee la tabla
- cualquier accion secundaria queda subordinada a la lectura del entrenamiento

Reglas:

- no mezclar otros dias de la semana en esta pantalla
- no convertir la vista en dashboard de multiples bloques
- no ocultar el boton de volver
- no romper la continuidad entre esta vista y el modal de ejercicio

Resultado esperado:

- el usuario siente que entro al detalle exacto de lo que le toca ese dia
- la tabla se entiende como foco principal
- el retorno a `Ejercicio` es inmediato y natural

Vista: `Modal de ejercicio`

- entrada desde una fila de ejercicio en detalle de rutina disponible o detalle diario
- se abre superpuesto a la pagina actual
- no cambia la ruta principal ni la seccion activa
- se cierra y devuelve al usuario exactamente al contexto anterior

### Comportamiento del modal de ejercicio

El modal de ejercicio resuelve consulta contextual. Su trabajo es ampliar informacion sin romper el flujo de lectura de la rutina.

Disparo:

- se abre desde el nombre o fila interactiva de un ejercicio
- puede abrirse desde detalle de rutina disponible o detalle diario

Foco:

- aparece centrado sobre la pagina actual
- atenúa el fondo sin borrar el contexto
- toma el foco principal de lectura mientras está abierto

Jerarquia del contenido:

- nombre del ejercicio
- imagen
- descripcion o explicacion completa
- accion clara de cierre

Tamano:

- grande y comodo para lectura completa
- no ocupa toda la pantalla en desktop
- en mobile puede crecer mas si hace falta legibilidad, manteniendo una salida clara

Cierre:

- boton de cierre visible
- cierre por accion deliberada del usuario
- opcionalmente cierre por overlay o tecla de escape cuando la implementacion lo soporte

Retorno:

- al cerrar, el usuario vuelve exactamente al mismo contexto visual y funcional
- no se pierde la vista activa, la posicion de lectura ni la seccion seleccionada del panel

Reglas:

- no debe cambiar la ruta principal
- no debe sentirse como una pagina encubierta
- no debe abrir cadenas de modales
- no debe exigir al usuario reconstruir contexto al cerrarlo

Resultado esperado:

- el usuario resuelve la duda sobre el ejercicio
- vuelve al entrenamiento sin friccion
- el modal se percibe como parte del flujo, no como interrupcion ajena

### Vistas admin

Vista: `Admin dashboard`

- entrada desde panel lateral cuando el rol lo permite
- muestra accesos a gestion de rutinas y ejercicios
- mantiene disponible el resto de la experiencia de usuario

Vista: `Gestion de rutinas`

- entrada desde `Admin dashboard`
- permite acceder a crear rutina
- permite acceder a modificar rutinas existentes
- vuelve a `Admin dashboard` o al listado de rutinas administrativas segun contexto

Vista: `Crear rutina`

- entrada desde `Gestion de rutinas`
- prepara el builder o formulario de rutina semanal
- vuelve a `Gestion de rutinas` al cancelar o completar

Vista: `Modificar rutina`

- entrada desde una rutina existente en `Gestion de rutinas`
- prepara edicion de estructura semanal existente
- vuelve a `Gestion de rutinas` al cancelar o completar

Vista: `Gestion de ejercicios`

- entrada desde `Admin dashboard`
- permite acceder a agregar ejercicio
- permite acceder a modificar ejercicios existentes
- vuelve a `Admin dashboard` o al listado de ejercicios administrativos segun contexto

Vista: `Agregar ejercicio`

- entrada desde `Gestion de ejercicios`
- prepara formulario de alta de ejercicio
- vuelve a `Gestion de ejercicios` al cancelar o completar

Vista: `Modificar ejercicio`

- entrada desde un ejercicio existente en `Gestion de ejercicios`
- prepara formulario de edicion basica
- vuelve a `Gestion de ejercicios` al cancelar o completar

### Tipos de transicion

Navegacion principal:

- ocurre desde el panel lateral
- cambia la vista dominante del area principal
- actualiza la seccion activa

Navegacion secundaria:

- ocurre dentro del area principal
- entra a detalles, listados o formularios del modulo actual
- mantiene activa la seccion principal del panel

Retorno:

- usa boton de volver cuando la vista deriva de una seleccion concreta
- vuelve al contexto funcional anterior, no necesariamente al historial bruto del navegador

Modal:

- se usa para detalle de ejercicio
- no reemplaza la pagina actual
- no cambia la seccion activa
- conserva el contexto visual y funcional del usuario

## Fronteras entre secciones

Las secciones principales del shell deben mantenerse separadas por responsabilidad funcional.

### `Agregar rutinas`

Responsabilidad:

- explorar rutinas disponibles creadas por admin
- entrar al detalle de una rutina disponible
- preparar el guardado de una rutina en la cuenta del usuario

No debe encargarse de:

- mostrar rutinas ya guardadas por el usuario como foco principal
- definir cual es la rutina activa del usuario
- mostrar el organigrama semanal del entrenamiento activo
- incluir herramientas de administracion

### `Mis rutinas`

Responsabilidad:

- mostrar las rutinas guardadas por el usuario
- permitir identificar o cambiar la rutina activa
- preparar acciones futuras de renombrado y gestion personal

No debe encargarse de:

- listar todo el catalogo disponible como vista principal
- reemplazar la lectura semanal de `Ejercicio`
- incluir gestion administrativa de ejercicios o rutinas globales

### `Ejercicio`

Responsabilidad:

- traducir la rutina activa a una lectura semanal por dias
- mostrar si cada dia corresponde a entrenamiento o descanso
- permitir entrar al detalle del entrenamiento del dia

No debe encargarse de:

- explorar el catalogo general
- gestionar la coleccion completa de rutinas guardadas
- asumir tareas administrativas
- reemplazar el modal de ejercicio con navegacion profunda extra

### `Admin dashboard`

Responsabilidad:

- concentrar la gestion de rutinas globales y ejercicios globales
- servir como entrada a crear o modificar contenido administrativo

No debe encargarse de:

- reemplazar la experiencia base de usuario
- absorber `Agregar rutinas`, `Mis rutinas` o `Ejercicio`
- mostrar decisiones personales del usuario como rutina activa

### Regla de separacion

La app debe seguir estas reglas:

- `Agregar rutinas` resuelve exploracion y seleccion
- `Mis rutinas` resuelve posesion y configuracion personal
- `Ejercicio` resuelve ejecucion o lectura del entrenamiento activo
- `Admin dashboard` resuelve administracion global

Si una vista intenta cubrir dos de esas responsabilidades al mismo tiempo, la separacion esta mal definida y debe corregirse.

## Area principal de contenido

El area principal muestra una sola vista dominante por vez.

Reglas:

- no duplicar navegacion principal dentro del contenido
- evitar composiciones tipo landing o hero para pantallas operativas
- priorizar tablas, listas, estados y acciones concretas
- mantener encabezados breves y funcionales
- reservar modales para detalles contextuales, no para reemplazar paginas completas

Estados base:

- estado vacio
- estado de carga
- estado con datos
- estado de error
- estado de acceso restringido cuando G5 lo implemente

## Tabla de rutina y modal de ejercicio

La tabla de rutina y el modal de ejercicio son dos patrones centrales de consulta. Deben compartir el mismo lenguaje visual del shell y priorizar lectura clara por encima de decoracion.

### Tabla de rutina

Rol:

- mostrar el entrenamiento del dia o de una rutina disponible con lectura inmediata
- permitir comparar filas sin ruido visual
- servir como punto de entrada al modal de ejercicio

Patron visual:

- tabla limpia, compacta y legible
- encabezado de columnas claro pero sobrio
- filas con separacion discreta y ritmo constante
- sin tratamiento ornamental pesado

Columnas visibles base:

- ejercicio
- series
- repeticiones
- RIR
- descanso

Jerarquia:

- el nombre del ejercicio es la columna dominante
- los datos de series, repeticiones, RIR y descanso se leen como soporte tecnico
- los ejercicios deben verse claramente interactivos cuando abren modal

Reglas:

- evitar convertir cada fila en card en desktop
- mantener alineacion consistente entre columnas
- sostener buena lectura horizontal sin ensuciar la tabla
- preparar una adaptacion mobile sin romper jerarquia de datos

### Modal de ejercicio

Rol:

- resolver la duda sobre un ejercicio sin sacar al usuario de la rutina actual
- mostrar informacion suficiente en una capa enfocada y central

Patron visual:

- modal centrado y grande, pero no full screen en desktop
- fondo de pagina atenuado para reforzar foco
- superficie fuerte, clara y coherente con el sistema visual base
- contenido con jerarquia evidente entre nombre, imagen y descripcion

Contenido minimo:

- nombre del ejercicio
- imagen
- descripcion o explicacion completa

Jerarquia interna:

- nombre del ejercicio como encabezado principal
- imagen como apoyo de reconocimiento
- descripcion como bloque principal de lectura
- cierre claro y accesible

Reglas:

- no navegar a otra pagina para resolver el detalle
- no abrir un modal pequeño que fuerce scroll torpe o lectura comprimida
- no ocupar toda la pantalla en desktop salvo que mobile lo exija
- al cerrar, el usuario vuelve exactamente al contexto anterior

### Relacion entre tabla y modal

La tabla debe sugerir interaccion sin perder densidad operativa.

El modal debe ampliar informacion sin romper el flujo de consulta.

La transicion entre ambas piezas debe sentirse como:

- ampliar contexto
- resolver duda
- volver al trabajo

No como:

- cambio de pagina encubierto
- popup accesorio sin informacion suficiente

## Responsive

En desktop, el panel lateral debe permanecer visible y poder compactarse.

En mobile, el panel debe comportarse como `Sheet` o drawer desplegable para conservar espacio de lectura.

Reglas:

- el contenido nunca debe quedar bloqueado por el panel
- la navegacion debe seguir siendo accesible desde cualquier vista
- las tablas deben tener una estrategia mobile antes de implementar datos reales

## Usuario y admin en un mismo shell

No se crea un layout administrativo completamente separado para el MVP.

Motivo:

- el admin tambien puede usar la experiencia de usuario
- un solo shell reduce duplicacion
- G5 puede controlar visibilidad y acceso por rol sin rehacer navegacion
- G6 y G7 pueden montar gestion admin dentro del mismo marco visual

## Base visual de Admin dashboard

El `Admin dashboard` debe sentirse como una capa de gestion dentro del mismo producto, no como un panel externo ni como una variante visualmente aislada.

### Estructura visual

La vista admin usa la misma estructura general del shell:

- panel lateral izquierdo persistente
- encabezado contextual breve
- area principal amplia para herramientas y listados

Dentro del area principal, `Admin dashboard` se organiza en tres bloques:

- encabezado operativo con titulo y descripcion corta
- bloque primario de accesos administrativos
- bloque secundario con contexto o estado general cuando haga falta

No necesita hero, resumenes inflados ni metricas decorativas para el MVP.

### Jerarquia de accesos

La jerarquia visual debe hacer evidente que admin entra para gestionar dos dominios:

- `Rutinas`
- `Ejercicios`

Esos accesos deben ser el foco dominante de la pantalla y resolverse como acciones o paneles claros, no como un mosaico ambiguo de cards equivalentes.

Orden recomendado:

- `Rutinas` primero, por ser el flujo administrativo mas estructural
- `Ejercicios` despues, como catalogo de soporte para las rutinas

### Diferencias utiles respecto del flujo de usuario

La vista admin no cambia de identidad visual, pero si cambia de tono operativo:

- mas densidad funcional y menos enfasis narrativo
- acciones de gestion mas visibles
- encabezados mas directos
- menos foco en estados personales del usuario

La diferencia debe apoyarse en jerarquia, copy y composicion, no en cambiar drasticamente paleta, tipografia o layout.

### Limites de diseno

Para el MVP, `Admin dashboard` no debe sobredisenarse con:

- metricas ficticias
- widgets de actividad sin datos reales
- multiples columnas de resumen sin funcion concreta
- accesos duplicados a las mismas tareas

La base correcta es una pantalla sobria, clara y extensible para que G6 y G7 monten gestion real sin rehacer estructura.

## Entradas administrativas para gestion

Las entradas administrativas deben dejar visible desde el primer nivel como se accede a cada flujo real de trabajo, sin introducir aun logica completa de CRUD.

### Punto de partida

El recorrido administrativo parte en `Admin dashboard` y desde ahi se bifurca en dos modulos:

- `Gestion de rutinas`
- `Gestion de ejercicios`

Cada modulo debe resolver tres niveles funcionales:

- listado principal
- alta
- edicion basica

### Gestion de rutinas

Entrada:

- acceso primario desde `Admin dashboard`

Vista base:

- listado de rutinas existentes
- accion visible para `Crear rutina`
- acceso claro a `Modificar rutina` desde cada item o fila

Relacion entre vistas:

- `Admin dashboard` abre `Gestion de rutinas`
- `Gestion de rutinas` contiene el listado como vista de referencia
- `Crear rutina` nace desde una accion principal del listado
- `Modificar rutina` nace desde una rutina puntual del listado

La pantalla de listado debe funcionar como centro del modulo, no como paso descartable.

### Gestion de ejercicios

Entrada:

- acceso primario desde `Admin dashboard`

Vista base:

- listado de ejercicios existentes
- accion visible para `Agregar ejercicio`
- acceso claro a `Modificar ejercicio` desde cada item o fila

Relacion entre vistas:

- `Admin dashboard` abre `Gestion de ejercicios`
- `Gestion de ejercicios` contiene el listado como vista de referencia
- `Agregar ejercicio` nace desde una accion principal del listado
- `Modificar ejercicio` nace desde un ejercicio puntual del listado

Igual que en rutinas, el listado debe ser el centro del modulo y la base de retorno estable.

### Regla de navegacion administrativa

La navegacion admin debe sostener estas reglas:

- el acceso primario siempre sale desde `Admin dashboard`
- listado, alta y edicion pertenecen al mismo modulo
- alta y edicion no deben sentirse como rutas sueltas sin contexto
- el retorno debe priorizar volver al listado del modulo antes que saltar fuera del flujo

### Preparacion para G6 y G7

Esta estructura deja lista la base para que:

- G6 implemente CRUD de ejercicios sobre `Gestion de ejercicios`
- G7 implemente CRUD de rutinas sobre `Gestion de rutinas`

Sin rearmar shell, jerarquia de accesos ni relacion entre listado y formularios.

## Limites de este paso

Este paso define estructura y experiencia base.

No implementa:

- autenticacion real
- permisos por rol
- persistencia
- seleccion real de rutina activa
- CRUD de ejercicios o rutinas
- modal funcional final

Esas piezas se implementan en grupos posteriores sobre este shell.
