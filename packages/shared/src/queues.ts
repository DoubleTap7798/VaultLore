export const queueNames = {
  cardScan: "card-scan",
  compRefresh: "comp-refresh",
  marketSummary: "market-summary",
  alertNotification: "alert-notification",
  scanNotification: "scan-result-notification",
  subscriptionReconciliation: "subscription-reconciliation",
  nightlyValuationRefresh: "nightly-valuation-refresh"
} as const;

export type QueueName = (typeof queueNames)[keyof typeof queueNames];
