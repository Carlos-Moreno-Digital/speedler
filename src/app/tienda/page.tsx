import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ShopContent from './ShopContent';

export const metadata: Metadata = {
  title: 'Tienda',
  description:
    'Explora nuestra tienda de componentes informáticos, periféricos y electrónica.',
};

interface SearchParams {
  category?: string;
  manufacturer?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  sortBy?: string;
  page?: string;
}

async function getProducts(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 12;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { isActive: true };

  if (searchParams.category) {
    where.category = { slug: searchParams.category };
  }
  if (searchParams.manufacturer) {
    where.manufacturer = { slug: searchParams.manufacturer };
  }
  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { summary: { contains: searchParams.search, mode: 'insensitive' } },
      { sku: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }
  if (searchParams.minPrice || searchParams.maxPrice) {
    where.salePrice = {};
    if (searchParams.minPrice) {
      (where.salePrice as Record<string, number>).gte = parseFloat(
        searchParams.minPrice
      );
    }
    if (searchParams.maxPrice) {
      (where.salePrice as Record<string, number>).lte = parseFloat(
        searchParams.maxPrice
      );
    }
  }
  if (searchParams.inStock === 'true') {
    where.stock = { gt: 0 };
  }

  let orderBy: Record<string, string> = { createdAt: 'desc' };
  switch (searchParams.sortBy) {
    case 'price_asc':
      orderBy = { salePrice: 'asc' };
      break;
    case 'price_desc':
      orderBy = { salePrice: 'desc' };
      break;
    case 'name':
      orderBy = { name: 'asc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, manufacturer: true },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      salePrice: Number(p.salePrice),
      costPrice: Number(p.costPrice),
      canonDigital: Number(p.canonDigital),
      stock: p.stock,
      manufacturer: p.manufacturer ? { name: p.manufacturer.name } : null,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

async function getCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
  });
}

async function getManufacturers() {
  return prisma.manufacturer.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });
}

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [data, categories, manufacturers] = await Promise.all([
    getProducts(searchParams),
    getCategories(),
    getManufacturers(),
  ]);

  return (
    <ShopContent
      products={data.products}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      totalPages={data.totalPages}
      categories={categories}
      manufacturers={manufacturers}
      currentFilters={searchParams as Record<string, string | undefined>}
    />
  );
}
