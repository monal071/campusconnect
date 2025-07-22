import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export default function HomeRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Let middleware handle admin redirects, just go to root
    router.replace("/");
  }, [router]);
  
  return null;
}
