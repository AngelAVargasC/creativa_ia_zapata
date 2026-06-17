# Plataforma Creativa IA · Grupo Zapata

SaaS **multi-tenant** que genera contenido creativo (propuestas, guiones, copies y dinámicas para Facebook/Instagram) para las 52 agencias del Grupo Zapata. Cada agencia es un *tenant* con su propio perfil de marca. La IA produce; los usuarios revisan, aprueban y publican.

> Las reglas de ingeniería que rigen este repo viven en [`PROMPT-MASTER.md`](./PROMPT-MASTER.md).

## Stack

- **TypeScript** (strict) + **Next.js** (App Router) — front y back en un proyecto.
- **Vercel AI SDK** como capa única sobre **Claude / OpenAI / Gemini**. **Modo arranque:** todas las tareas (incl. imagen) se enrutan a **Gemini** en `routeModel`; Claude/OpenAI quedan soportados pero inactivos (reactivables por config).
- **Supabase** — **solo** Postgres + Auth + **RLS** (no se usa para imágenes).
- **Cloudflare R2** (S3-compatible) para imágenes generadas — **egress $0**, mucho más barato a escala para servirlas.
- **Zod** para validación en todos los bordes.
- **Vitest** para tests.

## Arquitectura (clean / hexagonal)

```
src/
  app/                         # Next.js App Router (UI + API routes)
    api/generate/copy/route.ts # endpoint: valida, resuelve tenant, delega
  config/env.ts                # validación Zod del entorno (server-only)
  core/                        # núcleo transversal, sin framework
    result.ts errors.ts http.ts tenant.ts
    auth/resolve-tenant.ts     # tenant SIEMPRE desde la sesión del servidor
    logging/logger.ts          # logging estructurado (JSON)
  ai/                          # puerto + provider router + adapter
    ports.ts                   # LanguageModelPort (el dominio depende de esto)
    models.ts                  # routeModel(task) -> (provider, model)
    usage.ts                   # registro de tokens/costo/latencia
    adapters/vercel-ai-sdk.ts  # único punto que conoce el SDK
  db/                          # adapters Supabase (server / browser)
  storage/                     # puerto StoragePort + adapter intercambiable
    ports.ts                   # put / getSignedUrl / delete (con tenantId)
    path.ts                    # rutas SIEMPRE prefijadas por tenant ({tenantId}/...)
    store-image.ts             # helper de aplicación sobre el puerto
    adapters/r2-storage.ts     # único punto que conoce Cloudflare R2 (AWS SDK v3)
  modules/
    content-generation/        # feature module (vertical slice)
      domain/                  # reglas puras + caso de uso (testeable aislado)
      application/             # composición (env + adapter -> caso de uso)
      schema.ts                # Zod del borde
      __tests__/               # unit tests offline (fake del puerto)
supabase/migrations/           # esquema versionado con RLS
```

**Costuras deliberadas** (donde sabemos que escalará): proveedores de IA, storage y tenants. Todo lo demás sigue YAGNI.

## Multi-tenant y seguridad

- El `tenant_id` se resuelve **en el servidor** desde `app_metadata.tenant_id` del JWT (`core/auth/resolve-tenant.ts`). **Nunca** se acepta del cliente.
- **RLS** activo en todas las tablas; las políticas aíslan por `current_tenant_id()` (ver migración `0001`).
- Secretos solo por variables de entorno (`.env.local`, nunca en el repo).

### Almacenamiento de imágenes (Cloudflare R2)

- Las imágenes generadas por IA van a **R2** (S3-compatible), **nunca** a `/public` ni al repo, ni a Supabase Storage.
- Toda ruta de objeto se **prefija por tenant**: `{tenantId}/...`. El helper `storage/path.ts` rechaza traversal (`..`), rutas absolutas y backslashes para que un `key` no escape del tenant.
- Se sirven por **URL firmada** (`getSignedUrl`); el `tenantId` llega resuelto desde la sesión (tipo *branded* `TenantId`), nunca del cliente.
- El adapter (`R2StorageAdapter`) queda detrás de `StoragePort`: cambiar de proveedor = nuevo adapter, sin tocar el dominio.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # requiere GOOGLE_GENERATIVE_AI_API_KEY (único proveedor activo)
npm run typecheck            # tsc --noEmit (strict)
npm run lint                 # next lint + no-explicit-any
npm run test                 # vitest (offline, deterministas)
npm run dev                  # http://localhost:3000
```

### Endpoint

`POST /api/generate/copy` — requiere sesión autenticada con tenant.

```jsonc
// body
{
  "brand": { "agencyName": "Zapata Norte", "voice": "cercana y clara", "bannedWords": ["gratis"] },
  "brief": { "platform": "instagram", "objective": "lanzamiento", "tone": "inspirador", "product": "cafetera", "maxChars": 280 }
}
```

Añade `?stream=1` para recibir el copy en streaming (texto plano).

## Próximos incrementos (no ahora)

- Wiring de Auth Supabase (login + middleware de refresco de sesión) y siembra de tenants de prueba.
- Persistir `content_pieces` y `generation_logs` (hoy la telemetría va a log estructurado).
- **Inngest** para imágenes en lote y tareas largas (siempre por cola, nunca en el request).
- Más slices: guiones, propuestas, dinámicas.
- RAG / pgvector — fase posterior.
