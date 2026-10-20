import { redirect } from "next/navigation";

export default function BookEntry() {
  redirect("/dashboard/principal?book=streams");
}
