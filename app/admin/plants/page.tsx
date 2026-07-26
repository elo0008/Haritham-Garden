import { redirect } from "next/navigation";

export default function AdminPlantsPage() {
  redirect("/admin?tab=plants");
}
