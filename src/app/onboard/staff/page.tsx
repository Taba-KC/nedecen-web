/**
 * Connect the staff onboarding URL to the same account-claim form used by learners. The kind
 * prop selects staff-specific lookup and claim requests.
 */
import { AccountClaimPage } from "@/components/onboarding/AccountClaimPage";

export default function StaffOnboardPage() {
  return <AccountClaimPage kind="staff" />;
}
