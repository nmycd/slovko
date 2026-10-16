import { CourseTabs } from "@/components/course-tabs";
import { LearnFrame } from "@/components/learn-frame";
import { course } from "@/lib/course";
import { reviewFromUnit } from "@/lib/review/session";

// Word review opens once these lessons are done (the side card is closed until then);
// the optional writing lessons don't count.
const reviewOpensAfter = course
  .filter((u) => u.number < reviewFromUnit)
  .flatMap((u) => u.lessons.filter((l) => l.kind !== "writing").map((l) => l.id));

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CourseTabs />
      <LearnFrame reviewOpensAfter={reviewOpensAfter}>{children}</LearnFrame>
    </>
  );
}
