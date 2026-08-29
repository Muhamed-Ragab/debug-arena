import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChallengesLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="h-14 border-b">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <Skeleton className="mb-2 h-7 w-32" />
        <Skeleton className="mb-6 h-4 w-64" />
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {["stat-1", "stat-2", "stat-3"].map((id) => (
            <Card className="p-4" key={id}>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-6 w-20" />
            </Card>
          ))}
        </div>
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"].map((id) => (
            <Card className="p-4" key={id}>
              <Skeleton className="mb-3 h-5 w-3/4" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
