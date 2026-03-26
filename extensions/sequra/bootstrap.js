import { getConfig } from '@evershop/evershop/src/lib/util/getConfig.js';

export default async () => {
  // Import the registerPaymentMethod function
  const { registerPaymentMethod } = await import(
    '@evershop/evershop/src/modules/checkout/services/getAvailablePaymentMethods.js'
  );

  registerPaymentMethod({
    init: async () => ({
      code: 'sequra',
      name: 'Pago aplazado (seQura)'
    }),
    validator: async () => {
      const config = getConfig('system.sequra', {});
      return config.status === true || config.status === 1;
    }
  });
};
