/** Strip server-only pickup secret before sending orders to clients. */
export function stripPickupSecret<T extends { pickupSecret?: string | null }>(
  order: T
): Omit<T, "pickupSecret"> {
  const { pickupSecret: _secret, ...safe } = order;
  return safe;
}

export function stripPickupSecretFromOrders<
  T extends { pickupSecret?: string | null },
>(orders: T[]): Omit<T, "pickupSecret">[] {
  return orders.map(stripPickupSecret);
}
