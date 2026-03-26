import { parseSpanishDecimal, createSlug } from './utils';

export interface CsvProduct {
  idCategoria: number;
  idFabricante: number;
  referencia: string;
  partNumber: string;
  upcCode: string;
  peso: number;
  fotografia: string;
  oferta: boolean;
  fechaInicioOferta: string;
  fechaFinOferta: string;
  nombre: string;
  resumen: string;
  descripcion: string;
  infoGeneral: string;
  especificacionesAmpliadas: string;
  accesorios: string;
  stock: number;
  fechaStock: string;
  tasas: number;
  coste: number;
  desCategoria: string;
  desFabricante: string;
}

export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCsvContent(content: string): CsvProduct[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) return [];

  const products: CsvProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length < 22) continue;

    const nombre = fields[10] || fields[11] || `Producto ${fields[2]}`;
    if (!nombre || nombre.trim() === '') continue;

    products.push({
      idCategoria: parseInt(fields[0]) || 0,
      idFabricante: parseInt(fields[1]) || 0,
      referencia: fields[2] || '',
      partNumber: fields[3] || '',
      upcCode: fields[4] || '',
      peso: parseSpanishDecimal(fields[5]),
      fotografia: fields[6] || '',
      oferta: fields[7] === '1',
      fechaInicioOferta: fields[8] || '',
      fechaFinOferta: fields[9] || '',
      nombre: nombre,
      resumen: fields[11] || '',
      descripcion: fields[12] || '',
      infoGeneral: fields[13] || '',
      especificacionesAmpliadas: fields[14] || '',
      accesorios: fields[15] || '',
      stock: parseInt(fields[16]) || 0,
      fechaStock: fields[17] || '',
      tasas: parseSpanishDecimal(fields[18]),
      coste: parseSpanishDecimal(fields[19]),
      desCategoria: fields[20] || '',
      desFabricante: fields[21] || '',
    });
  }

  return products;
}

export function generateProductSlug(name: string, sku: string): string {
  const slug = createSlug(name);
  if (!slug || slug.length < 2) {
    return createSlug(`producto-${sku}`);
  }
  return slug;
}
