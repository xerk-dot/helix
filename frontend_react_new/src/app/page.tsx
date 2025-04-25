"use client";

import { signIn } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { GithubIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (session?.user) {
      router.push("/dashboard");
    }
  }, [session, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#FF6B6B] to-[#4ECDC4]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Welcome to <span className="text-[hsl(147,100%,70%)]">Helix</span>
        </h1>
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          >
            <GithubIcon className="h-5 w-5" />
            Sign in with GitHub
          </Button>
        </div>
      </div>
    </main>
  );
}
