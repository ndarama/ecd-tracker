import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUser, deleteUser } from "@/actions/users";
import { PencilSquareIcon, UserPlusIcon } from "@heroicons/react/24/outline";

interface Props {
  searchParams: Promise<{ saved?: string; error?: string }>;
}

const ROLE_LABELS = {
  CHW: "Community Health Worker",
  SUPERVISOR: "Supervisor",
  ADMIN: "Super Administrator",
};

export default async function UsersPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return (
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-10 text-center">
        <h1 className="text-lg font-semibold text-gray-900">User management unavailable</h1>
        <p className="mt-2 text-sm text-gray-500">Only Super Administrators can manage users.</p>
      </div>
    );
  }

  const params = await searchParams;
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: { _count: { select: { children: true, visits: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="mt-0.5 text-sm text-gray-500">Create and manage CHW, supervisor, and administrator accounts</p>
      </div>

      {params.saved && <Notice tone="green">User {params.saved} successfully.</Notice>}
      {params.error && <Notice tone="red">{errorMessage(params.error)}</Notice>}

      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
          <UserPlusIcon className="h-5 w-5 text-emerald-600" />
          Create User
        </h2>
        <form action={createUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Full name" name="name" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Temporary password" name="password" type="password" minLength={8} required />
          <RoleField />
          <Field label="Village / area" name="village" />
          <Field label="Phone" name="phone" type="tel" />
          <div className="md:col-span-2 lg:col-span-3 flex justify-end">
            <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Create User</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
          <h2 className="font-semibold text-gray-800">All Users ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Village</th>
                <th className="px-5 py-3">Assigned records</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{user.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{user.email}</td>
                  <td className="px-5 py-3.5"><span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{ROLE_LABELS[user.role]}</span></td>
                  <td className="px-5 py-3.5 text-gray-600">{user.village ?? "—"}</td>
                  <td className="px-5 py-3.5 text-gray-600">{user._count.children} children · {user._count.visits} visits</td>
                  <td className="px-5 py-3.5"><div className="flex items-center justify-end gap-3"><Link href={`/users/${user.id}/edit`} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"><PencilSquareIcon className="h-4 w-4" />Edit</Link>{user.id !== session.user.id && user._count.children === 0 && user._count.visits === 0 && <form action={deleteUser.bind(null, user.id)}><button type="submit" className="text-xs font-medium text-red-600 hover:text-red-800">Delete</button></form>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", required, minLength }: { label: string; name: string; type?: string; required?: boolean; minLength?: number }) {
  return <div><label className="mb-1 block text-xs font-medium text-gray-600">{label}{required && <span className="text-red-500"> *</span>}</label><input name={name} type={type} required={required} minLength={minLength} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>;
}

function RoleField() {
  return <div><label className="mb-1 block text-xs font-medium text-gray-600">Role <span className="text-red-500">*</span></label><select name="role" required defaultValue="CHW" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="CHW">Community Health Worker</option><option value="SUPERVISOR">Supervisor</option><option value="ADMIN">Super Administrator</option></select></div>;
}

function Notice({ tone, children }: { tone: "green" | "red"; children: React.ReactNode }) {
  return <div className={`rounded-lg px-4 py-3 text-sm ${tone === "green" ? "bg-green-50 text-green-800 ring-1 ring-green-200" : "bg-red-50 text-red-800 ring-1 ring-red-200"}`}>{children}</div>;
}

function errorMessage(error: string) {
  return { email: "That email address is already in use.", assigned: "This user cannot be deleted while children or visits are assigned.", self: "You cannot delete your own account.", missing: "User was not found." }[error] ?? "An error occurred.";
}
