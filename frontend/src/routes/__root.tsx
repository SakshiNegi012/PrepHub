import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  redirect,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportAppError } from "../lib/error-reporting";
import { AppStoreProvider, useAppStore } from "@/lib/app-store";
import { AppController } from "@/components/prep/app-controller";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">404</p>
        <h1 className="mt-3 font-serif text-4xl text-ink">This page isn't on your desk.</h1>
        <p className="mt-3 text-sm text-ink-muted">
          The link you followed doesn't lead anywhere in PrepHub. Head back home and pick up where
          you left off.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-page hover:bg-ink/90 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl text-ink">Something interrupted your session.</h1>
        <p className="mt-3 text-sm text-ink-muted">
          We couldn't load this page. Try again, or head home to continue learning.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-page hover:bg-ink/90 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-hairline px-4 py-2 text-sm font-medium text-ink hover:bg-surface-sunken transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PrepHub — Your calm learning workspace" },
      {
        name: "description",
        content:
          "PrepHub is the personal study desk for students preparing for placements. Organize goals, resources, notes and progress in one calm workspace.",
      },
      { name: "author", content: "PrepHub" },
      { property: "og:title", content: "PrepHub — Your calm learning workspace" },
      {
        property: "og:description",
        content:
          "One place to organize your placement prep. Goals, resources, notes and progress — without the noise.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;

    const authFlag = window.localStorage.getItem("ph_auth");
    const token = window.localStorage.getItem("ph_token");
    const isAuthenticated = authFlag === "1" || Boolean(token);
    const isAuthRoute = location.pathname === "/auth" || location.pathname.startsWith("/auth");

    if (!isAuthenticated && !isAuthRoute) {
      throw redirect({ to: "/auth" });
    }

    if (isAuthenticated && isAuthRoute) {
      throw redirect({ to: "/" });
    }
  },
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthed } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const pathname = window.location.pathname;
    const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth");

    if (!isAuthed && !isAuthRoute) {
      void router.navigate({ to: "/auth", replace: true });
      return;
    }

    if (isAuthed && isAuthRoute) {
      void router.navigate({ to: "/", replace: true });
    }
  }, [isAuthed, ready, router]);

  if (!ready) return null;

  if (!isAuthed && window.location.pathname !== "/auth") {
    return null;
  }

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>
        <AppController>
          <AuthGate>
            <Outlet />
          </AuthGate>
        </AppController>
      </AppStoreProvider>
    </QueryClientProvider>
  );
}
