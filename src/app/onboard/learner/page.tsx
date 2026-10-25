/**
 * Connect the learner onboarding URL to the reusable account-claim form. The kind prop
 * selects learner labels and backend endpoints.
 */
import { AccountClaimPage } from "@/components/onboarding/AccountClaimPage";

export default function LearnerOnboardPage() {
  return <AccountClaimPage kind="learner" />;
}
