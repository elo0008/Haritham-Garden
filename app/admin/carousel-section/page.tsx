import { redirect } from "next/navigation";

export default function CarouselSectionAdminPage() {
  redirect("/admin?tab=storefront");
}
