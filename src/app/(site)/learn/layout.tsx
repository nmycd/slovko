import { CourseTabs } from "@/components/course-tabs";
import { LearnFrame } from "@/components/learn-frame";
import { dictionary } from "@/lib/course";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CourseTabs />
      <LearnFrame dictionary={dictionary}>{children}</LearnFrame>
    </>
  );
}
