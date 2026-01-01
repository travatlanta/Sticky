import 'server-only';

/**
 * Feature flags for controlled rollouts.
 *
 * These are intentionally server-only. If a flag must affect client UI,
 * read it in a Server Component / Route Handler and pass it down as props.
 */

export type FeatureFlagName =
  | 'EMAIL_DELIVERY_QUEUE_ENABLED'
  | 'RECEIPT_PREVIEW_ENABLED'
  | 'RECEIPT_TEST_SEND_ENABLED'
  | 'RECEIPT_LOGO_UPLOAD_ENABLED';

const TRUTHY_VALUES = new Set<string>(['1', 'true', 'yes', 'y', 'on']);
const FALSY_VALUES = new Set<string>(['0', 'false', 'no', 'n', 'off']);

function parseBooleanFlag(value: string | undefined, defaultValue = false): boolean {
  if (value == null) return defaultValue;

  const normalized = value.trim().toLowerCase();
  if (TRUTHY_VALUES.has(normalized)) return true;
  if (FALSY_VALUES.has(normalized)) return false;

  return defaultValue;
}

export function getFeatureFlag(name: FeatureFlagName, defaultValue = false): boolean {
  return parseBooleanFlag(process.env[name], defaultValue);
}

export const featureFlags = {
  EMAIL_DELIVERY_QUEUE_ENABLED: getFeatureFlag('EMAIL_DELIVERY_QUEUE_ENABLED'),
  RECEIPT_PREVIEW_ENABLED: getFeatureFlag('RECEIPT_PREVIEW_ENABLED'),
  RECEIPT_TEST_SEND_ENABLED: getFeatureFlag('RECEIPT_TEST_SEND_ENABLED'),
  RECEIPT_LOGO_UPLOAD_ENABLED: getFeatureFlag('RECEIPT_LOGO_UPLOAD_ENABLED'),
} as const;

export function isFeatureEnabled(name: FeatureFlagName): boolean {
  return featureFlags[name];
}
