# Architecture

La arquitectura del proyecto se distribuye en archivos separados dentro de [docs/architecture/README.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/architecture/README.md) para reducir costo de lectura y mantener contexto acotado por tema.

## Orden recomendado de lectura

1. [01-scope.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/architecture/01-scope.md)
2. [02-modules.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/architecture/02-modules.md)
3. [03-flows.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/architecture/03-flows.md)
4. [04-layers-and-boundaries.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/architecture/04-layers-and-boundaries.md)
5. [05-structure-and-naming.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/architecture/05-structure-and-naming.md)
6. [06-implementation-strategy.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/architecture/06-implementation-strategy.md)
7. [07-frontend-experience.md](C:/Users/fedet/Documents/GitHub/gymcontrol/docs/architecture/07-frontend-experience.md)

## Nota

Este archivo funciona como puerta de entrada corta. La fuente de verdad arquitectonica vive ahora en la carpeta `docs/architecture/`.

Estado auth vigente:

- `docs/architecture/02-modules.md` define el modulo de acceso con `OTP + Google OAuth`
- `docs/architecture/03-flows.md` resume el flujo de acceso vigente y el callback SSR
- `docs/architecture/07-frontend-experience.md` documenta la superficie de login y su lugar en el shell
