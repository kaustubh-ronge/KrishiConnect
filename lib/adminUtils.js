/**
 * Builds a Prisma 'where' clause for Orders based on admin filters
 */
export function buildOrderFilters(filters) {
  const where = {};

  if (filters.status && filters.status !== 'ALL') {
    where.orderStatus = filters.status;
  }

  if (filters.paymentStatus && filters.paymentStatus !== 'ALL') {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
    where.paymentMethod = filters.paymentMethod;
  }

  if (filters.payoutStatus && filters.payoutStatus !== 'ALL') {
    where.payoutStatus = filters.payoutStatus;
  }

  if (filters.buyerRole && filters.buyerRole !== 'ALL') {
    where.buyerUser = { role: filters.buyerRole };
  }

  // Seller role is trickier since items can have different sellers
  // But usually we filter orders that have AT LEAST one item from a specific seller type
  if (filters.sellerRole && filters.sellerRole !== 'ALL') {
    where.items = { some: { product: { sellerType: filters.sellerRole } } };
  }
  
  if (filters.deliveryPartnerId && filters.deliveryPartnerId !== 'ALL') {
    where.deliveryJobs = { some: { deliveryBoyId: filters.deliveryPartnerId } };
  }

  if (filters.minAmount) {
    where.totalAmount = { ...where.totalAmount, gte: parseFloat(filters.minAmount) };
  }
  if (filters.maxAmount) {
    where.totalAmount = { ...where.totalAmount, lte: parseFloat(filters.maxAmount) };
  }

  if (filters.search) {
    where.OR = [
      { id: { contains: filters.search, mode: 'insensitive' } },
      { buyerName: { contains: filters.search, mode: 'insensitive' } },
      { shippingAddress: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return where;
}

/**
 * Builds a Prisma 'where' clause for Products based on admin filters
 */
export function buildProductFilters(filters) {
  const where = {};

  if (filters.category && filters.category !== 'ALL') {
    where.category = filters.category;
  }

  if (filters.sellerType && filters.sellerType !== 'ALL') {
    where.sellerType = filters.sellerType;
  }

  if (filters.approvalStatus && filters.approvalStatus !== 'ALL') {
    // Note: Assuming a field for this, if not, we use isAvailable or seller's sellingStatus
    // where.status = filters.approvalStatus;
  }

  if (filters.stockStatus) {
    if (filters.stockStatus === 'low') where.availableStock = { lte: 10, gt: 0 };
    if (filters.stockStatus === 'out') where.availableStock = 0;
    if (filters.stockStatus === 'available') where.availableStock = { gt: 0 };
  }

  if (filters.search) {
    where.OR = [
      { productName: { contains: filters.search, mode: 'insensitive' } },
      { category: { contains: filters.search, mode: 'insensitive' } },
      { variety: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return where;
}

/**
 * Builds a Prisma 'where' clause for Users based on admin filters
 */
export function buildUserFilters(filters, role) {
  const where = {};
  
  if (role === 'delivery') {
    if (filters.status && filters.status !== 'ALL') where.approvalStatus = filters.status;
  } else {
    if (filters.status && filters.status !== 'ALL') where.sellingStatus = filters.status;
  }

  if (filters.securityStatus && filters.securityStatus !== 'ALL') {
    where.user = { isDisabled: filters.securityStatus === 'BLOCKED' };
  }

  if (filters.search) {
    if (role === 'agent') {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } }
      ];
    } else {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { district: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
  }

  return where;
}
