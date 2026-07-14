import { statusLabel } from '@/modules/solicitudes/labels';

/** Chip de estatus tipo semáforo. Tolera valores antiguos (fallback neutral). */
export const StatusBadge = ({ status }: { readonly status: string }) => {
  const meta = statusLabel(status);
  return (
    <span className="badge" data-tone={meta.tone}>
      {meta.label}
    </span>
  );
};
