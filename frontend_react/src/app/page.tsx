import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { GithubIcon } from "lucide-react";

export default async function Home() {
  const session = await auth();
  
  if (session?.user) {
    return redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Welcome to <span className="text-[hsl(280,100%,70%)]">Helix</span>
        </h1>
        <div className="flex flex-col items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <a href="/api/auth/signin">
              <GithubIcon className="h-5 w-5" />
              Sign in with GitHub
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
