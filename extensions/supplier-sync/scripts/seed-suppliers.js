/**
 * Seed script: Insert the 7 suppliers into the supplier_sync table.
 * Usage: node extensions/supplier-sync/scripts/seed-suppliers.js
 *
 * Requires DATABASE_URL or PG* env vars to be set.
 */
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const suppliers = [
  {
    supplierName: 'DMI',
    syncType: 'CSV_URL',
    endpoint: 'https://www.dmi.es/catalogo.aspx?u=CT033377&p=FGAAIOXG',
    syncIntervalMinutes: 360,
    fieldMapping: {
      separator: ';',
      sku: 'ARTICULO',
      name: 'DENOMINA',
      partNumber: 'PARTNUMBER',
      ean: 'EAN',
      image: 'IMAGEN',
      costPrice: 'COMPRA',
      stock: 'STOCK',
      category: 'SUBCATEGORIADEPRODUCTO',
      manufacturer: 'MARCA',
      weight: 'PESO',
      canonDigital: 'PRECIOCANO',
      description: 'SHORTDESC',
      specs: 'LONGDESC'
    }
  },
  {
    supplierName: 'Globomatik',
    syncType: 'CSV_URL',
    endpoint: 'http://multimedia.globomatik.net/csv/import.php?username=2131&password=62300314&mode=all&type=default',
    syncIntervalMinutes: 360,
    fieldMapping: {
      separator: ';',
      sku: 'codigo',
      name: 'Descripcion',
      partNumber: 'Part Number',
      ean: 'EAN',
      image: 'Imagen HD',
      costPrice: 'Precio',
      stock: 'Stock',
      category: 'Familia',
      manufacturer: 'Marca',
      weight: 'Peso',
      canonDigital: 'Canon',
      description: 'Descripcion Resumen',
      specs: 'Descripcion Larga'
    }
  },
  {
    supplierName: 'Desyman',
    syncType: 'CSV_URL',
    endpoint: 'https://desyman.com/module/ma_desyman/download_rate_customer?token=a8467dfc86e382a04251c0e90506e561&format=CSV',
    syncIntervalMinutes: 360,
    fieldMapping: {
      separator: ';',
      sku: 'codigo',
      name: 'descripcion',
      partNumber: 'pn',
      ean: 'ean',
      image: 'foto',
      costPrice: 'precio',
      stock: 'stock',
      category: 'familia',
      manufacturer: 'marca',
      weight: 'peso',
      canonDigital: 'canon',
      description: 'caracteristicas'
    }
  },
  {
    supplierName: 'AS Europa',
    syncType: 'CSV_URL',
    endpoint: 'https://www.aseuropa.com/descarga-tarifa?tipo=csv&user=008364&code=6e62641e25c1d254e7502d817478819a',
    syncIntervalMinutes: 360,
    fieldMapping: {
      separator: ';',
      sku: 'COD_INTERNO',
      name: 'NOMBRE',
      partNumber: 'REF_FABRICANTE',
      ean: 'EAN',
      image: 'FOTO',
      costPrice: 'PRECIO',
      stock: 'STOCK',
      category: 'FAMILIA',
      manufacturer: 'FABRICANTE',
      weight: 'PESO',
      canonDigital: 'CANON',
      description: 'INFO_CORTA',
      specs: 'ESPECIFICACIONES_TECNICAS'
    }
  },
  {
    supplierName: 'Infortisa',
    syncType: 'CSV_URL',
    endpoint: 'https://apiv2.infortisa.com/api/Tarifa/GetFileV5EXT?user=1E5608A7-3910-4803-B350-D5E8A2B48F0E',
    syncIntervalMinutes: 360,
    fieldMapping: {
      separator: ';',
      sku: 'CODIGOINTERNO',
      name: 'TITULO',
      partNumber: 'REFFABRICANTE',
      ean: 'EAN/UPC',
      image: 'IMAGEN',
      costPrice: 'PRECIOSINCANON',
      stock: 'STOCKCENTRAL',
      category: 'TITULOSUBFAMILIA',
      manufacturer: 'NOMFABRICANTE',
      weight: 'PESO',
      canonDigital: 'CANONLPI',
      description: 'DESCRIPTION'
    }
  },
  {
    supplierName: 'Supercomp',
    syncType: 'FTP',
    endpoint: 'ftp.supercompdigital.info',
    credentials: JSON.stringify({ user: 'cli10085', password: 'scmay9339', port: 21, filePattern: 'catalogo_*.txt' }),
    syncIntervalMinutes: 360,
    fieldMapping: {
      separator: ';',
      sku: 'ID',
      name: 'NOMBREARTICULO',
      partNumber: 'CODIGOFABRICANTE',
      ean: 'EAN',
      image: 'IMAGEN',
      costPrice: 'PRECIO',
      stock: 'STOCK',
      category: 'FAMILIA',
      manufacturer: 'MARCA',
      weight: 'PESO',
      canonDigital: 'CANON',
      description: 'DESCRIPCION',
      specs: 'CARACTERISTICASHTML'
    }
  },
  {
    supplierName: 'Compuspain',
    syncType: 'CSV_URL',
    endpoint: 'https://www.compuspain.eu/download/__cp_VSW/Services/outProductosTarifaDatos/?uID=C009513&uLG=WC009513&uPW=W760_7636&urVal=csv&uFR=1',
    syncIntervalMinutes: 360,
    fieldMapping: {
      separator: ';',
      sku: 'ARTCODIGO',
      name: 'ARTNOMBRE',
      partNumber: 'ARTPARTNUMBER',
      ean: 'ARTEAN',
      image: null,
      costPrice: 'ARTPRECIOUNIDAD',
      stock: 'ARTSTOCKDISPONIBLE',
      category: 'ARTFAMILIANOMBRE',
      manufacturer: 'FABRICANTE',
      weight: 'ARTPESO',
      canonDigital: 'ARTRECURSOIMPORTE'
    }
  }
];

async function seedSuppliers() {
  const client = await pool.connect();
  try {
    console.log('[seed-suppliers] Starting supplier seed...');

    for (const s of suppliers) {
      await client.query(
        `INSERT INTO supplier_sync (supplier_name, sync_type, endpoint, credentials, sync_interval_minutes, field_mapping, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (supplier_name)
         DO UPDATE SET
           sync_type = EXCLUDED.sync_type,
           endpoint = EXCLUDED.endpoint,
           credentials = EXCLUDED.credentials,
           sync_interval_minutes = EXCLUDED.sync_interval_minutes,
           field_mapping = EXCLUDED.field_mapping,
           is_active = true,
           updated_at = NOW()`,
        [
          s.supplierName,
          s.syncType,
          s.endpoint,
          s.credentials || null,
          s.syncIntervalMinutes,
          JSON.stringify(s.fieldMapping)
        ]
      );
      console.log(`[seed-suppliers] Upserted: ${s.supplierName}`);
    }

    console.log(`[seed-suppliers] Done. Seeded ${suppliers.length} suppliers.`);
  } catch (error) {
    console.error('[seed-suppliers] Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedSuppliers().catch((err) => {
  console.error(err);
  process.exit(1);
});
