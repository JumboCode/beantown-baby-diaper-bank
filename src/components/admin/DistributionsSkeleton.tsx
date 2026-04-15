import { Skeleton } from "@mantine/core";

function YearGroupSkeleton({ monthCount = 3 }: { monthCount?: number }) {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white">
      {/* Year header row */}
      <div className="flex items-center gap-3 p-3">
        <Skeleton circle h={18} w={18} />
        <Skeleton h={28} w={60} radius="sm" />
        <Skeleton h={24} w={110} radius="xl" />
      </div>
      {/* Month rows */}
      <div className="border-t border-gray-100 p-3 space-y-2">
        {Array.from({ length: monthCount }).map((_, i) => (
          <div key={i} className="w-full rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3 p-3">
              <Skeleton circle h={18} w={18} />
              <Skeleton h={22} w={130} radius="sm" />
              <Skeleton h={22} w={100} radius="xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DistributionsSkeleton() {
  return (
    <div className="space-y-2">
      <YearGroupSkeleton monthCount={4} />
      <YearGroupSkeleton monthCount={3} />
      <YearGroupSkeleton monthCount={2} />
      <YearGroupSkeleton monthCount={3} />
    </div>
  );
}
