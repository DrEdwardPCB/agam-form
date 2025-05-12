import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Github } from 'lucide-react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { FormsList } from '@/components/forms-list';
import { env } from '@/lib/envalid/env';

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar session={session} />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Agam Form
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              Production ready form platform
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={env.NEXT_PUBLIC_GITHUBURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Github className="h-5 w-5" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-32">
            <FormsList session={session} allowDelete={false} all={true} allowEdit={false} />
          </div>
        </div>
      </main>

      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-500">
            &copy; {new Date().getFullYear()} Agam Form. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
