import { CourseTabs } from "@/components/course-tabs";
import { LearnFrame } from "@/components/learn-frame";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CourseTabs />
      <LearnFrame>{children}</LearnFrame>
    </>
  );
}
