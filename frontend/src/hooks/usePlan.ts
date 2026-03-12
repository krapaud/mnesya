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

export type PlanFeature = keyof typeof FREE_LIMITS;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UsePlanReturn {
    plan: PlanType;
    isPremium: boolean;
    isLimitReached: (feature: PlanFeature, currentCount: number) => boolean;
}

export const usePlan = (): UsePlanReturn => {
    const { caregiverData } = useCaregiverProfile();

    const plan: PlanType = caregiverData?.plan ?? 'free';
    const isPremium = plan === 'premium';

    const isLimitReached = (feature: PlanFeature, currentCount: number): boolean => {
        if (isPremium) return false;
        return currentCount >= FREE_LIMITS[feature];
    };

    return { plan, isPremium, isLimitReached };
};
