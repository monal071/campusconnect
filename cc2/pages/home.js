import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export default function HomeRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to dashboard instead of root to avoid landing page loop
    router.replace("/dashboard");
  }, [router]);
  
  return null;
}
