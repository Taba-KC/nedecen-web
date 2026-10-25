/**
 * Entry point for /dashboard/learner. Learners currently use RoleDashboard rather than the
 * teacher bookshelf. Edit that component to change the learner screen.
 */
import RoleDashboard from "@/components/dashboard/RoleDashboard";

export default function Page() { return <RoleDashboard role="learner" />; }
