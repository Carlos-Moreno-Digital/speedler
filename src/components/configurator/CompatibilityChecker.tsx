'use client';

interface CompatibilityCheckerProps {
  issues: string[];
  validating: boolean;
}

export default function CompatibilityChecker({
  issues,
  validating,
}: CompatibilityCheckerProps) {
  if (validating) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full" />
          <span className="text-sm">Verificando compatibilidad...</span>
        </div>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-green-700">
          <span className="text-lg">&#x2713;</span>
          <span className="text-sm font-medium">Todos los componentes son compatibles</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 rounded-xl p-4">
      <h3 className="font-bold text-yellow-800 mb-2 text-sm">
        Problemas de compatibilidad
      </h3>
      <ul className="space-y-2">
        {issues.map((issue, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-yellow-700">
            <span className="text-yellow-500 mt-0.5">&#x26A0;</span>
            {issue}
          </li>
        ))}
      </ul>
    </div>
  );
}
