/** Persist current wizard details before a separate designer tab reads the draft. */
export async function persistOrderForDesigner<State extends { orderId?: string }>(state: State, request: typeof fetch = fetch): Promise<string> {
  const response = await request('/api/orders/drafts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: state.orderId, orderState: state }),
  })
  if (!response.ok) throw new Error('Save this order draft before opening the designer. Please retry.')
  const saved: { orderId?: unknown } = await response.json()
  if (typeof saved.orderId !== 'string' || !saved.orderId || (state.orderId && saved.orderId !== state.orderId)) {
    throw new Error('The order draft could not be confirmed. Please retry.')
  }
  return saved.orderId
}
