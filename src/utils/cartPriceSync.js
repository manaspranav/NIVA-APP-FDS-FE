import { getProductById } from '../data/productsData';

const syncCartItemWithCatalog = (item) => {
  const productType = item.productType || item.type || 'fastfood';
  const latestProduct = getProductById(item.id, productType);

  if (!latestProduct) {
    return item;
  }

  return {
    ...item,
    name: latestProduct.name,
    price: latestProduct.price,
    originalPrice: latestProduct.originalPrice,
    image: latestProduct.image,
    category: latestProduct.category,
    type: latestProduct.type || item.type || productType,
    productType: latestProduct.type || item.productType || productType,
    isVeg: latestProduct.isVeg
  };
};

export const syncCartWithLatestPrices = (cartItems) => {
  if (!Array.isArray(cartItems)) {
    return { syncedCart: [], changed: false };
  }

  let changed = false;

  const syncedCart = cartItems.map((item) => {
    const syncedItem = syncCartItemWithCatalog(item);

    if (
      !changed &&
      (
        syncedItem.price !== item.price ||
        syncedItem.originalPrice !== item.originalPrice ||
        syncedItem.name !== item.name ||
        syncedItem.image !== item.image ||
        syncedItem.category !== item.category ||
        syncedItem.type !== item.type ||
        syncedItem.productType !== item.productType ||
        syncedItem.isVeg !== item.isVeg
      )
    ) {
      changed = true;
    }

    return syncedItem;
  });

  return { syncedCart, changed };
};
