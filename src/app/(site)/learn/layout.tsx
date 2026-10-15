import { CourseTabs } from "@/components/course-tabs";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CourseTabs />
      {children}
    </>
  );
}
