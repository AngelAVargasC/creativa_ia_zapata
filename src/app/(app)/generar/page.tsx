import { PageHeader } from '@/components/shell/page-header';
import { FadeIn } from '@/components/shell/fade-in';
import shell from '@/components/shell/shell.module.css';
import { GenerarClient } from './generar-client';

export default function GenerarPage() {
  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title="Generar contenido"
          description="Copies, guiones y dinámicas para Facebook e Instagram, sobre los lineamientos de tu marca. Míralo escribirse en vivo."
        />
      </FadeIn>
      <div className={shell.pageBody}>
        <GenerarClient />
      </div>
    </>
  );
}
