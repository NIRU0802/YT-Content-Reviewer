import { Action, RiskLevel, Category } from '@/types';

export interface PolicyResult {
  action: Action;
  reason: string;
}

export function determineAction(
  risk_level: RiskLevel,
  category: Category,
  confidence: number
): PolicyResult {
  if (risk_level === 'CRITICAL') {
    return {
      action: 'Remove',
      reason: 'Critical risk level detected. Immediate removal recommended.',
    };
  }

  if (category === 'Hate Speech' && confidence >= 0.7) {
    return {
      action: 'Review',
      reason: 'Hate speech content detected with high confidence. Manual review required.',
    };
  }

  if (risk_level === 'High') {
    return {
      action: 'Review',
      reason: 'High risk level requires manual review before decision.',
    };
  }

  if (risk_level === 'Medium') {
    return {
      action: 'Review',
      reason: 'Medium risk level. Review recommended before publishing.',
    };
  }

  return {
    action: 'Allow',
    reason: 'Content meets safety standards. No action required.',
  };
}

export function getActionPriority(action: Action): number {
  const priorities: Record<Action, number> = {
    Remove: 1,
    Escalate: 2,
    Review: 3,
    Allow: 4,
  };
  return priorities[action];
}

export function shouldEscalate(
  risk_level: RiskLevel,
  category: Category
): boolean {
  return (
    risk_level === 'CRITICAL' ||
    (category === 'Hate Speech' && risk_level !== 'Low') ||
    category === 'Violence'
  );
}