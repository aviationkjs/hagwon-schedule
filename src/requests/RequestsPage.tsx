import { useAuth } from "../auth/AuthProvider";
import { canManageSchedule } from "../auth/roles";
import { AdminRequestBoard } from "./AdminRequestBoard";
import { RequestList } from "./RequestList";

export function RequestsPage() {
  const { profile } = useAuth();
  return (
    <div className="page">
      <h2>변경 요청</h2>
      {canManageSchedule(profile!.role) ? <AdminRequestBoard /> : <RequestList />}
    </div>
  );
}
