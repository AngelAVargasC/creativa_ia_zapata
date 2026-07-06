import { PageHeader } from '@/components/shell/page-header';
import { EmptyState } from '@/components/shell/empty-state';
import { FadeIn } from '@/components/shell/fade-in';
import { LibraryIcon, SparklesIcon } from '@/components/shell/icons';
import shell from '@/components/shell/shell.module.css';

export default function BibliotecaPage() {
  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title="Biblioteca"
          description="Historial de todo lo generado por tu agencia: copies, guiones y propuestas."
        />
      </FadeIn>
      <div className={shell.pageBody}>
        <FadeIn delay={0.08}>
          <EmptyState
            icon={<LibraryIcon size={22} />}
            title="Tu biblioteca está vacía"
            description="Lo que generes aparecerá aquí, listo para reutilizar, editar o aprobar."
            action={
              <a className="btn btn-primary" href="/generar">
                <SparklesIcon size={16} /> Generar contenido
              </a>
            }
          />
        </FadeIn>
      </div>
    </>
  );
}
