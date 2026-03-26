import { getConfig } from '@evershop/evershop/src/lib/util/getConfig.js';

export default async () => {
  // Import the registerPaymentMethod function
  const { registerPaymentMethod } = await import(
    '@evershop/evershop/src/modules/checkout/services/getAvailablePaymentMethods.js'
  );

  registerPaymentMethod({
    init: async () => ({
      code: 'redsys',
      name: 'Tarjeta de cr\u00e9dito/d\u00e9bito (Redsys)'
    }),
    validator: async () => {
      const config = getConfig('system.redsys', {});
      return config.status === true || config.status === 1;
    }
  });
};
