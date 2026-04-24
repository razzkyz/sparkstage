const DOKU_CHECKOUT_PATH = '/checkout/v1/payment'
const DOKU_STATUS_PATH_PREFIX = '/orders/v1/status/'

function toBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

async function sha256Base64(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return toBase64(new Uint8Array(digest))
}

async function hmacSha256Base64(params: {
  secretKey: string
  value: string
}) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(params.secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(params.value))
  return toBase64(new Uint8Array(signature))
}

function normalizeIsoTimestamp(value: string) {
  return value.replace(/\.\d{3}Z$/, 'Z')
}

export function getDokuApiBaseUrl(isProduction: boolean) {
  return isProduction ? 'https://api.doku.com' : 'https://api-sandbox.doku.com'
}

export function getDokuCheckoutSdkUrl(isProduction: boolean) {
  return isProduction
    ? 'https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js'
    : 'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js'
}

export function getDokuCheckoutPath() {
  return DOKU_CHECKOUT_PATH
}

export function getDokuStatusPath(orderNumber: string) {
  return `${DOKU_STATUS_PATH_PREFIX}${encodeURIComponent(orderNumber)}`
}

export function createDokuRequestId() {
  return crypto.randomUUID()
}

export function createDokuRequestTimestamp() {
  return normalizeIsoTimestamp(new Date().toISOString())
}

export async function createDokuSignature(params: {
  clientId: string
  requestId: string
  requestTimestamp: string
  requestTarget: string
  secretKey: string
  body?: string | null
}) {
  const digest = typeof params.body === 'string' ? await sha256Base64(params.body) : null

  const signatureLines = [
    `Client-Id:${params.clientId}`,
    `Request-Id:${params.requestId}`,
    `Request-Timestamp:${params.requestTimestamp}`,
    `Request-Target:${params.requestTarget}`,
  ]

  if (digest) {
    signatureLines.push(`Digest:${digest}`)
  }

  const value = signatureLines.join('\n')
  const signedValue = await hmacSha256Base64({
    secretKey: params.secretKey,
    value,
  })

  return {
    digest,
    signature: `HMACSHA256=${signedValue}`,
  }
}

export async function buildDokuRequestHeaders(params: {
  clientId: string
  requestId: string
  requestTimestamp: string
  requestTarget: string
  secretKey: string
  body?: string | null
}) {
  const { signature, digest } = await createDokuSignature(params)
  const headers: Record<string, string> = {
    'Client-Id': params.clientId,
    'Request-Id': params.requestId,
    'Request-Timestamp': params.requestTimestamp,
    Signature: signature,
  }
  if (digest) {
    headers['Digest'] = digest
  }
  return headers
}

export async function verifyDokuSignature(params: {
  clientId: string
  requestId: string
  requestTimestamp: string
  requestTarget: string
  secretKey: string
  rawBody: string
  providedSignature: string
}) {
  const { signature } = await createDokuSignature({
    clientId: params.clientId,
    requestId: params.requestId,
    requestTimestamp: params.requestTimestamp,
    requestTarget: params.requestTarget,
    secretKey: params.secretKey,
    body: params.rawBody,
  })

  return signature === params.providedSignature.trim()
}

export function parseDokuExpiredDate(value: unknown): string | null {
  const raw = String(value || '').trim()
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/)
  if (!match) return null

  const [, year, month, day, hour, minute, second] = match
  const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export function mapDokuStatus(transactionStatus: unknown, orderStatus?: unknown): string {
  const tx = String(transactionStatus || '').trim().toUpperCase()
  const order = String(orderStatus || '').trim().toUpperCase()

  if (tx === 'SUCCESS') return 'paid'
  if (tx === 'REFUNDED') return 'refunded'
  if (tx === 'EXPIRED' || order === 'ORDER_EXPIRED') return 'expired'
  if (tx === 'FAILED') return 'failed'
  if (tx === 'PENDING' || tx === 'TIMEOUT' || tx === 'REDIRECT') return 'pending'
  if (order === 'ORDER_GENERATED' || order === 'ORDER_RECOVERED') return 'pending'

  return 'pending'
}
