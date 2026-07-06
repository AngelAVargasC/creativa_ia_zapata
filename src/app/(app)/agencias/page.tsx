import { PageHeader } from '@/components/shell/page-header';
import { EmptyState } from '@/components/shell/empty-state';
import { FadeIn } from '@/components/shell/fade-in';
import { BuildingIcon, PlusIcon } from '@/components/shell/icons';
import shell from '@/components/shell/shell.module.css';

export default function AgenciasPage() {
  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title="Agencias y marcas"
          description="Perfiles de marca por agencia: voz, lineamientos y restricciones que guían a la IA."
          actions={
            <button className="btn btn-primary" type="button">
              <PlusIcon /> Nuevo perfil
            </button>
          }
        />
      </FadeIn>
      <div className={shell.pageBody}>
        <FadeIn delay={0.08}>
          <EmptyState
            icon={<BuildingIcon size={22} />}
            title="Sin perfiles de marca todavía"
            description="Define el perfil de marca de cada agencia para que el contenido generado respete su voz y sus lineamientos."
            action={
              <button className="btn btn-primary" type="button">
                <PlusIcon /> Crear perfil de marca
              </button>
            }
          />
        </FadeIn>
      </div>
    </>
  );
}
