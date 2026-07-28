const crypto = require('crypto');

export class WebhookError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}

export function validateWebhookConfig(secret: string | undefined): asserts secret is string {
  if (!secret) {
    throw new WebhookError(
      'Server misconfiguration: WEBHOOK_SECRET is not set',
      500,
      { env: 'APP_WEBHOOK_SECRET' }
    );
  }
}

export function validateSignature(
  rawBody: string,
  signature: string | undefined,
  webhookSecret: string
): void {
  const hmac = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const calculatedSignature = `sha256=${hmac}`;

  if (signature !== calculatedSignature) {
    throw new WebhookError(
      'Webhook signature mismatch',
      401,
      {
        receivedSignature: signature,
        calculatedSignature,
        rawBodyDefined: !!rawBody,
        rawBodyLength: rawBody ? rawBody.length : 0,
        secretLength: webhookSecret.length,
      }
    );
  }
}

export function validateTagFormat(tag: string): void {
  if (!/^v\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/.test(tag)) {
    throw new WebhookError(
      `Invalid version tag format: ${tag}. Expected: vN.N.N.N.N.N`,
      400,
      { tag, expectedFormat: 'vN.N.N.N.N.N' }
    );
  }
}

function getNamespacesToTrigger(newTag: string, prevTag?: string): string[] {
  const [n1, n2, n3, n4, n5, n6] = newTag.replace('v', '').split('.').map(Number);
  const [p1, p2, p3, p4, p5, p6] = prevTag?.replace('v', '').split('.').map(Number) || [0, 0, 0, 0, 0, 0];

  const namespaces: string[] = [];
  if (n1 > p1 || n2 > p2 || n3 > p3) namespaces.push('back');
  if (n4 > p4 || n5 > p5 || n6 > p6) namespaces.push('web');
  return namespaces;
}

export function validateAndGetNamespaces(newTag: string, prevTag?: string): string[] {
  const namespaces = getNamespacesToTrigger(newTag, prevTag);
  if (namespaces.length === 0) {
    throw new WebhookError(
      `No version increase in ${prevTag || 'any component'} (tag: ${newTag})`,
      200,
      { tag: newTag, prevTag: prevTag || null, namespaces: [] }
    );
  }
  return namespaces;
}
