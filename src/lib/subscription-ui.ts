export type SubscriptionUiStatus =
  | "trial"
  | "active"
  | "expired"
  | "suspended"
  | "canceled"
  | "past_due"
  | "none";

export type SubscriptionUiSummary = {
  status: SubscriptionUiStatus;
  label: string;
  message: string;
  daysRemaining: number;
  finalDateText: string;
  highlight: boolean;
  actionLabel: string | null;
};

export function getDaysRemaining(targetDate?: string | null): number {
  if (!targetDate) return 0;

  const date = new Date(targetDate);
  if (Number.isNaN(date.getTime())) return 0;

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function getSubscriptionStatusSummary(input: {
  status?: string | null;
  trialStartAt?: string | null;
  trialEndAt?: string | null;
  startedAt?: string | null;
}): SubscriptionUiSummary {
  const status = (String(input.status ?? "trial").trim().toLowerCase() || "trial") as SubscriptionUiStatus;
  const daysRemaining = getDaysRemaining(input.trialEndAt ?? null);

  if (status === "trial") {
    return {
      status: "trial",
      label: "Prueba gratuita",
      message: daysRemaining > 0
        ? `Estás disfrutando de tu prueba gratuita. Te quedan ${daysRemaining} días.`
        : "Tu prueba gratuita está próxima a vencer.",
      daysRemaining,
      finalDateText: input.trialEndAt ? new Date(input.trialEndAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—",
      highlight: daysRemaining <= 7,
      actionLabel: "Ver planes",
    };
  }

  if (status === "expired") {
    return {
      status: "expired",
      label: "Trial vencido",
      message: "Tu período de prueba terminó. Elegí un plan para continuar utilizando StockFlow.",
      daysRemaining: 0,
      finalDateText: input.trialEndAt ? new Date(input.trialEndAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—",
      highlight: true,
      actionLabel: "Ver planes",
    };
  }

  if (status === "active") {
    return {
      status: "active",
      label: "Suscripción activa",
      message: "Suscripción activa. Tu plan está vigente y podés seguir usando StockFlow.",
      daysRemaining: 0,
      finalDateText: input.startedAt ? new Date(input.startedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—",
      highlight: false,
      actionLabel: null,
    };
  }

  if (status === "suspended") {
    return {
      status: "suspended",
      label: "Suspendida",
      message: "La cuenta está suspendida. Debés regularizar la suscripción para volver a acceder.",
      daysRemaining: 0,
      finalDateText: input.trialEndAt ? new Date(input.trialEndAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—",
      highlight: true,
      actionLabel: "Ver planes",
    };
  }

  if (status === "canceled") {
    return {
      status: "canceled",
      label: "Cancelada",
      message: "La suscripción fue cancelada. Podés reactivarla cuando lo necesites.",
      daysRemaining: 0,
      finalDateText: input.trialEndAt ? new Date(input.trialEndAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—",
      highlight: false,
      actionLabel: "Ver planes",
    };
  }

  if (status === "past_due") {
    return {
      status: "past_due",
      label: "Pago pendiente",
      message: "Hay un pago pendiente. Regularizá tu cuenta para continuar utilizando StockFlow.",
      daysRemaining: 0,
      finalDateText: input.trialEndAt ? new Date(input.trialEndAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—",
      highlight: true,
      actionLabel: "Ver planes",
    };
  }

  return {
    status: "none",
    label: "Sin suscripción",
    message: "Todavía no hay información de billing disponible para esta cuenta.",
    daysRemaining: 0,
    finalDateText: "—",
    highlight: false,
    actionLabel: "Ver planes",
  };
}
