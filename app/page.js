import AdminPage from "@/components/Page/AdminPage";
import AdvisorPage from "@/components/Page/AdvisorPage";
import StudentPage from "@/components/Page/StudentPage";
import { verifySession } from "@/functions/LoginAction";
import Link from "next/link";

export default async function page() {
  const sessionData = await verifySession();

  switch (sessionData.role) {
    case "admin":
      return <AdminPage session={sessionData} />;
    case "advisor":
      return <AdvisorPage session={sessionData} />;
    case "student":
      return <StudentPage session={sessionData} />;
    default:
      return (
        <div className="grid place-items-center text-lg font-medium">
          Unauthorized Access.
          <p>
            Return to
            <Link className="underline" href={"/auth"}>
              Login
            </Link>
          </p>
        </div>
      );
  }
}
