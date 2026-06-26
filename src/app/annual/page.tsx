import { redirect } from "next/navigation";

export default function AnnualPage() {
  redirect("/?modal=payment-annual");
}
