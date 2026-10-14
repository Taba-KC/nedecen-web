import { redirect } from "next/navigation";

export default function PrincipalHome() {
  redirect("/dashboard/principal/grades");
}
