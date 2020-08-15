export function createClientProductId(productId: number, variantId: string): string {
  return `${productId}-${variantId}`;
}

export function parseClientProductId(clientProductId: string): [number, string] {
  const [productIdStr, variantId] = clientProductId.split('-');
  const productId = parseInt(productIdStr);

  return [productId, variantId];
}
