import { format } from 'date-fns';
import { Clock9 } from 'lucide-react';
import { useMemo } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { useApiGetPlans, useCurrentPlan } from '@/hooks/usePlan';
import { useStore } from '@/store';

/**
 * Pending downgrade or cancellation, shown above the plan cards rather than inside the current
 * plan's card (Figma node 743:50491). Both queries are already cached by the plans section, so this
 * fetches its own data instead of threading props through the cards.
 */
export const ScheduledPlanChangeAlert: React.FC = () => {
    const env = useStore((state) => state.env);
    const { data: environmentData } = useCurrentPlan(env);
    const currentPlan = environmentData?.plan;
    const { data: plansList } = useApiGetPlans(env);

    const scheduledChange = useMemo(() => {
        if (!currentPlan?.orb_future_plan || !currentPlan.orb_future_plan_at) {
            return null;
        }

        const targetPlan = plansList?.data.find((p) => p.code === currentPlan.orb_future_plan);
        if (!targetPlan) {
            return null;
        }

        return { targetPlan, at: format(new Date(currentPlan.orb_future_plan_at), 'MMM d, yyyy') };
    }, [currentPlan, plansList]);

    if (!scheduledChange) {
        return null;
    }

    return (
        <Alert variant="warning">
            <Clock9 />
            <AlertTitle>Scheduled plan change</AlertTitle>
            <AlertDescription className="text-text-default">
                {scheduledChange.targetPlan.code === 'free'
                    ? `Your subscription will be cancelled on ${scheduledChange.at}`
                    : `Switches to ${scheduledChange.targetPlan.title} on ${scheduledChange.at}`}
            </AlertDescription>
        </Alert>
    );
};
