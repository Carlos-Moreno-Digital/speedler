export async function apiAdapterFetch(
  endpoint: string,
  credentials?: string,
  fieldMapping?: Record<string, string>
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (credentials) {
    try {
      const parsed = JSON.parse(credentials);
      if (parsed.apiKey) {
        headers['Authorization'] = `Bearer ${parsed.apiKey}`;
      }
      if (parsed.customHeaders) {
        Object.assign(headers, parsed.customHeaders);
      }
    } catch {
      // No auth
    }
  }

  const response = await fetch(endpoint, { headers });

  if (!response.ok) {
    throw new Error(
      `API fetch failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Convert JSON response to CSV format using field mapping
  const products = Array.isArray(data) ? data : data.products || data.items || [];
  if (products.length === 0) return '';

  const mapping = fieldMapping || {};
  const csvHeaders = [
    'IdCategoria', 'IdFabricante', 'Referencia', 'PartNumber', 'UpcCode',
    'Peso', 'Fotografia', 'Oferta', 'FechaInicioOferta', 'FechaFinOferta',
    'Nombre', 'Resumen', 'Descripcion', 'InfoGeneral', 'EspecificacionesAmpliadas',
    'Accesorios', 'Stock', 'FechaStock', 'Tasas', 'Coste', 'DesCategoria', 'DesFabricante',
  ];

  const lines = [csvHeaders.join(';')];

  for (const product of products) {
    const values = csvHeaders.map((header) => {
      const field = mapping[header] || header.toLowerCase();
      const value = product[field] ?? '';
      return String(value).replace(/;/g, ',');
    });
    lines.push(values.join(';'));
  }

  return lines.join('\n');
}
