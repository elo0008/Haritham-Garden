import { redirect } from "next/navigation";

export default function HeroBannerPage() {
  redirect("/admin?tab=storefront");
}
