import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductDetail from './ProductDetail';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface PageProps {
  params: { slug: string };
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      manufacturer: true,
    },
  });

  if (!product || !product.isActive) return null;

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    summary: product.summary,
    description: product.description,
    specs: product.specs,
    image: product.image,
    salePrice: Number(product.salePrice),
    costPrice: Number(product.costPrice),
    canonDigital: Number(product.canonDigital),
    stock: product.stock,
    weight: Number(product.weight),
    isOffer: product.isOffer,
    category: product.category
      ? { name: product.category.name, slug: product.category.slug }
      : null,
    manufacturer: product.manufacturer
      ? { name: product.manufacturer.name }
      : null,
  };
}

async function getRelatedProducts(
  categoryId: string | null,
  productId: string
) {
  if (!categoryId) return [];
  const products = await prisma.product.findMany({
    where: {
      categoryId,
      isActive: true,
      id: { not: productId },
      stock: { gt: 0 },
    },
    take: 4,
    include: { manufacturer: true },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.image,
    salePrice: Number(p.salePrice),
    manufacturer: p.manufacturer ? { name: p.manufacturer.name } : null,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Producto no encontrado' };
  return {
    title: product.name,
    description: product.summary || `Compra ${product.name} en Speedler`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const rawProduct = await prisma.product.findUnique({
    where: { slug: params.slug },
  });
  const related = await getRelatedProducts(
    rawProduct?.categoryId ?? null,
    product.id
  );

  return (
    <>
      <Header />
      <main>
        <ProductDetail product={product} relatedProducts={related} />
      </main>
      <Footer />
    </>
  );
}
