import { useInject, useInjectComponent } from "@brushy/di-react";
import { useStorage } from "@brushy/storage-react";
import { Moon, Sun, Users } from "lucide-react";
import { USER_LIST, USER_SERVICE } from "../features/users/users.tokens";

export default function App() {
  const userService = useInject(USER_SERVICE);
  const UserList = useInjectComponent(USER_LIST);
  const { value: theme, set: setTheme } = useStorage("ui:theme", "light");
  const isDark = theme === "dark";

  return (
    <div className={isDark ? "dark" : ""}>
      <main className="min-h-screen bg-zinc-100 text-zinc-900 transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 py-12">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">brushy-example</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">vite · di · storage</p>
            </div>

            <button
              type="button"
              aria-label={isDark ? "Usar tema claro" : "Usar tema escuro"}
              title={isDark ? "Tema claro" : "Tema escuro"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
            >
              {isDark ? <Sun className="size-4" strokeWidth={1.75} /> : <Moon className="size-4" strokeWidth={1.75} />}
            </button>
          </header>

          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <Users className="size-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.75} />
              <h2 className="text-sm font-medium">Users</h2>
              <span className="ml-auto text-xs tabular-nums text-zinc-400">{userService.list().length}</span>
            </div>
            <div className="p-2">
              <UserList users={userService.list()} />
            </div>
          </section>

          <p
            className="flex justify-center text-zinc-400 dark:text-zinc-500"
            aria-label={`Tema atual: ${isDark ? "escuro" : "claro"}`}
          >
            {isDark ? (
              <Moon className="size-4" strokeWidth={1.75} aria-hidden />
            ) : (
              <Sun className="size-4" strokeWidth={1.75} aria-hidden />
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
