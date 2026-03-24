import { getActivityLogsAction } from "@/lib/actions/activity"
import { ActivityClient } from "@/components/features/activity/activity-client"

export default async function ActivityPage() {
  const result = await getActivityLogsAction(undefined)

  const initialActivities = result.success ? result.data : []

  return <ActivityClient initialActivities={initialActivities} />
}
