import { fetchTagsWithUsage } from "./actions";
import { TagManagementClient } from "./_components/TagManagementClient";

export const metadata = {
  title: "Tag Management | Haritham Garden Admin",
  description: "Manage plant category tags, reorder tags, and inspect plant counts.",
};

export default async function AdminTagsPage() {
  const tags = await fetchTagsWithUsage();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <TagManagementClient initialTags={tags} />
    </div>
  );
}
