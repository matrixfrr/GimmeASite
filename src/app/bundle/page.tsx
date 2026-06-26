import { redirect } from "next/navigation";
export default function BundlePage() {
  redirect("/?modal=payment-bundle");
}
