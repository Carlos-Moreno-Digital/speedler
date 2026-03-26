import { cn } from '@/lib/utils';

interface Spec {
  label: string;
  value: string;
}

interface SpecGroup {
  title: string;
  specs: Spec[];
}

interface ProductSpecsProps {
  specs?: Spec[];
  groups?: SpecGroup[];
  className?: string;
}

export default function ProductSpecs({
  specs,
  groups,
  className,
}: ProductSpecsProps) {
  const renderSpecTable = (specList: Spec[]) => (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full">
        <tbody>
          {specList.map((spec, index) => (
            <tr
              key={index}
              className={cn(
                'border-b border-gray-100 last:border-b-0',
                index % 2 === 0 ? 'bg-bg-alt' : 'bg-white',
              )}
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-brand-brown-dark">
                {spec.label}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!specs && !groups) {
    return (
      <div className={cn('rounded-xl border-2 border-dashed border-gray-200 p-8 text-center', className)}>
        <p className="text-sm text-gray-500">
          No hay especificaciones disponibles para este producto.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Flat specs list */}
      {specs && specs.length > 0 && renderSpecTable(specs)}

      {/* Grouped specs */}
      {groups &&
        groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-brown-dark">
              <span className="h-1 w-4 rounded-full bg-brand-orange" />
              {group.title}
            </h3>
            {renderSpecTable(group.specs)}
          </div>
        ))}
    </div>
  );
}
