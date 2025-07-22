import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export default function HomeRedirect() {
  const router = useRouter();
  const { data: session } = useSession();
  
  useEffect(() => {
    // Check if user is admin, redirect to admin page
    if (session?.user?.role === 'admin') {
      router.replace("/admin");
    } else {
      router.replace("/");
    }
  }, [router, session]);
  
  return null;
}
