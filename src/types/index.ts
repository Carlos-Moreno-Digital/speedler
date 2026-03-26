export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  canonDigital: number;
  stock: number;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  canonDigitalTotal: number;
  total: number;
}

export interface PcComponent {
  componentTypeId: string;
  componentTypeName: string;
  productId: string;
  productName: string;
  price: number;
  image: string | null;
}

export interface PcBuildState {
  name: string;
  components: PcComponent[];
  totalPrice: number;
  compatibilityIssues: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductFilters {
  category?: string;
  manufacturer?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'newest';
  page?: number;
  pageSize?: number;
}

export interface CheckoutData {
  shippingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'REDSYS' | 'SEQURA' | 'TRANSFER';
  notes?: string;
  useSameAddress: boolean;
}

export interface TaxBreakdown {
  subtotal: number;
  canonDigitalTotal: number;
  ivaRate: number;
  ivaAmount: number;
  recargoEquivalenciaRate: number;
  recargoEquivalenciaAmount: number;
  shippingCost: number;
  total: number;
}
