import prisma from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

interface PricingRuleData {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  priority: number;
}

export async function calculateSalePrice(
  costPrice: number,
  productId?: string,
  categoryId?: string,
  manufacturerId?: string
): Promise<number> {
  const rules = await prisma.pricingRule.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' },
  });

  let bestRule: PricingRuleData | null = null;

  for (const rule of rules) {
    const ruleValue = Number(rule.value);
    const ruleData: PricingRuleData = {
      type: rule.type,
      value: ruleValue,
      priority: rule.priority,
    };

    if (rule.appliesTo === 'PRODUCT' && rule.targetId === productId) {
      bestRule = ruleData;
      break;
    }
    if (rule.appliesTo === 'CATEGORY' && rule.targetId === categoryId) {
      if (!bestRule || ruleData.priority > bestRule.priority) {
        bestRule = ruleData;
      }
    }
    if (rule.appliesTo === 'MANUFACTURER' && rule.targetId === manufacturerId) {
      if (!bestRule || ruleData.priority > bestRule.priority) {
        bestRule = ruleData;
      }
    }
    if (rule.appliesTo === 'GLOBAL') {
      if (!bestRule || ruleData.priority > bestRule.priority) {
        bestRule = ruleData;
      }
    }
  }

  if (!bestRule) {
    return Math.round(costPrice * 1.21 * 100) / 100;
  }

  if (bestRule.type === 'PERCENTAGE') {
    return Math.round(costPrice * (1 + bestRule.value / 100) * 100) / 100;
  }

  return Math.round((costPrice + bestRule.value) * 100) / 100;
}

export function applyPricingRule(
  costPrice: number,
  type: 'PERCENTAGE' | 'FIXED',
  value: number
): number {
  if (type === 'PERCENTAGE') {
    return Math.round(costPrice * (1 + value / 100) * 100) / 100;
  }
  return Math.round((costPrice + value) * 100) / 100;
}
