export type BillingProviderMethod = {
  createCustomer: (input: { companyId: string; email: string; name: string }) => Promise<{ id: string; provider: string } | null>;
  createCheckout: (input: { companyId: string; planCode: string; currency?: string; successUrl?: string; cancelUrl?: string }) => Promise<{ url: string; sessionId: string } | null>;
  createSubscription: (input: { companyId: string; planCode: string; providerCustomerId?: string | null }) => Promise<{ id: string; status: string } | null>;
  cancelSubscription: (input: { companyId: string; subscriptionId: string }) => Promise<{ ok: boolean; status?: string } | null>;
  changePlan: (input: { companyId: string; subscriptionId: string; planCode: string }) => Promise<{ ok: boolean; planCode?: string } | null>;
  getSubscription: (input: { companyId: string; subscriptionId?: string | null }) => Promise<{ id: string; status: string; planCode?: string | null } | null>;
  handleWebhook: (input: { payload: Record<string, unknown>; signature?: string | null }) => Promise<{ ok: boolean; event?: string } | null>;
};

export class NoopPaymentProvider implements BillingProviderMethod {
  async createCustomer() {
    return { id: "dev_customer", provider: "noop" };
  }

  async createCheckout({ companyId, planCode }) {
    return {
      url: `/dashboard/suscripciones?company=${encodeURIComponent(companyId)}&plan=${encodeURIComponent(planCode)}`,
      sessionId: `dev_${companyId}_${planCode}`,
    };
  }

  async createSubscription() {
    return { id: "dev_subscription", status: "trial" };
  }

  async cancelSubscription() {
    return { ok: true, status: "canceled" };
  }

  async changePlan() {
    return { ok: true, planCode: "standard" };
  }

  async getSubscription() {
    return { id: "dev_subscription", status: "trial", planCode: "standard" };
  }

  async handleWebhook() {
    return { ok: true, event: "noop.received" };
  }
}

export function getBillingProvider(): BillingProviderMethod {
  return new NoopPaymentProvider();
}
