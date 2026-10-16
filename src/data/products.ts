import { Company, Product } from '@/types/billing';
import productsData from './products.json';

export const allProducts: Product[] = (productsData as Product[]).sort((a, b) =>
  a.name.localeCompare(b.name)
);

export const makProducts: Product[] = allProducts.filter((p) => p.company === 'MAK');
export const bossProducts: Product[] = allProducts.filter((p) => p.company === 'BOSS');

export function getCompanyProducts(company: Company): Product[] {
  return company === 'MAK' ? makProducts : bossProducts;
}

export function searchProducts(query: string, companyFilter?: Company): Product[] {
  if (!query.trim()) {
    const list = companyFilter ? getCompanyProducts(companyFilter) : allProducts;
    return list.slice(0, 30);
  }

  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/);
  const pool = companyFilter ? getCompanyProducts(companyFilter) : allProducts;

  return pool
    .filter((product) => {
      const targetStr = `${product.name} ${product.productCode || ''} ${product.barcode || ''}`.toLowerCase();
      return tokens.every((token) => targetStr.includes(token));
    })
    .slice(0, 50);
}

export function getProductById(id: number): Product | undefined {
  return allProducts.find((p) => p.id === id);
}
