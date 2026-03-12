/**
 * Hook providing plan-related utilities (free vs premium limits).
 *
 * @module usePlan
 */
import { useCaregiverProfile } from './useCaregiverProfile';
import type { PlanType } from '../types/interfaces';

// ─── Limits ───────────────────────────────────────────────────────────────────

export const FREE_LIMITS = {
    profiles: 2,
} as const;

/** Features with a numeric free-plan cap. */
type LimitedFeature = keyof typeof FREE_LIMITS;

/** All premium-gated features (limited or premium-only). */
export type PlanFeature = LimitedFeature | 'recurrence';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UsePlanReturn {
    plan: PlanType;
    isPremium: boolean;
    isLimitReached: (feature: LimitedFeature, currentCount: number) => boolean;
}

export const usePlan = (): UsePlanReturn => {
    const { caregiverData } = useCaregiverProfile();

    const plan: PlanType = caregiverData?.plan ?? 'free';
    const isPremium = plan === 'premium';

    const isLimitReached = (feature: LimitedFeature, currentCount: number): boolean => {
        if (isPremium) return false;
        return currentCount >= FREE_LIMITS[feature];
    };

    return { plan, isPremium, isLimitReached };
};
