import type { User } from "../user.service";

export type UserListProps = {
  users: User[];
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserList({ users }: UserListProps) {
  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {users.map((user) => (
        <li key={user.id} className="flex items-center gap-3 px-3 py-2.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            aria-hidden
          >
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">id {user.id}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
