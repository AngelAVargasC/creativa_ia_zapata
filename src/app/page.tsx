export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '4rem 1.5rem',
        lineHeight: 1.6,
      }}
    >
      <p style={{ color: 'var(--muted)', letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: 12 }}>
        Grupo Zapata
      </p>
      <h1 style={{ fontSize: '2.4rem', lineHeight: 1.1, margin: '0.4rem 0 1rem' }}>
        Plataforma Creativa <span style={{ color: 'var(--accent)' }}>IA</span>
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '1.05rem' }}>
        SaaS multi-tenant que genera propuestas, guiones, copies y dinamicas para las 52 agencias del Grupo. Cada
        agencia es un tenant con su perfil de marca; la IA produce y los usuarios revisan, aprueban y publican.
      </p>

      <section
        style={{
          marginTop: '2.5rem',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '1.5rem',
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Estado: Fase 0 — Fundacion</h2>
        <ul style={{ color: 'var(--muted)', margin: 0, paddingLeft: '1.2rem' }}>
          <li>Arquitectura clean/hexagonal con puertos y adapters (IA, storage, tenants).</li>
          <li>Provider router config-driven sobre Vercel AI SDK (Claude / OpenAI / Gemini).</li>
          <li>Multi-tenant con RLS en Postgres; el tenant se resuelve siempre en el servidor.</li>
          <li>
            Endpoint vivo: <code>POST /api/generate/copy</code> (con <code>?stream=1</code> para streaming).
          </li>
        </ul>
      </section>
    </main>
  );
}
