import { PageHeader } from '@/components/shell/page-header';
import { EmptyState } from '@/components/shell/empty-state';
import { FadeIn } from '@/components/shell/fade-in';
import { DeckIcon, PlusIcon } from '@/components/shell/icons';
import shell from '@/components/shell/shell.module.css';

export default function PropuestasPage() {
  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title="Propuestas"
          description="Genera presentaciones y propuestas comerciales a partir de un brief."
          actions={
            <button className="btn btn-primary" type="button">
              <PlusIcon /> Nueva propuesta
            </button>
          }
        />
      </FadeIn>
      <div className={shell.pageBody}>
        <FadeIn delay={0.08}>
          <EmptyState
            icon={<DeckIcon size={22} />}
            title="Aún no hay propuestas"
            description="Crea tu primera propuesta para que el equipo la revise, ajuste y comparta con el cliente."
            action={
              <button className="btn btn-primary" type="button">
                <PlusIcon /> Crear propuesta
              </button>
            }
          />
        </FadeIn>
      </div>
    </>
  );
}
