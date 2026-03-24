export interface StripeSessionResponse {
  clientSecret: string;
  publishableKey: string;
  sessionId: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      wallet_address?: {
        network: string;
        crypto_currency: string;
        address: string;
      };
    };
  };
}
