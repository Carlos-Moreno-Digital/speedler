import { registerJob } from '@evershop/evershop/src/lib/cronjob/index.js';
import path from 'path';

export default function() {
  // Register sync cron job - every 15 minutes
  registerJob({
    name: 'supplierSync',
    schedule: '*/15 * * * *',
    resolve: path.resolve(import.meta.dirname, 'crons', 'syncSuppliers.js'),
    enabled: true
  });
}
