/** 주문 시 고객이 입력하는 배송·연락 정보 */

export type OrderShippingInput = {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingZip?: string;
  notes?: string;
};

export function normalizeShippingInput(
  raw: Partial<OrderShippingInput> | null | undefined,
): {
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingZip: string | null;
  notes: string | null;
} {
  const shippingName = raw?.shippingName?.trim() || null;
  const shippingPhone = raw?.shippingPhone?.trim() || null;
  const shippingAddress = raw?.shippingAddress?.trim() || null;
  const shippingZip = raw?.shippingZip?.trim() || null;
  const notes = raw?.notes?.trim() || null;
  return {
    shippingName,
    shippingPhone,
    shippingAddress,
    shippingZip,
    notes,
  };
}

export function validateShippingInput(
  _raw: Partial<OrderShippingInput>,
): string | null {
  return null;
}
