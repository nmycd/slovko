import type { Metadata } from "next";
import { ResourceList } from "@/components/resource-list";

export const metadata: Metadata = { title: "Resources" };

export default function ResourcesPage() {
  return <ResourceList />;
}
