import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUser } from "@/actions/users";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditUserPage({ params, searchParams }: Props) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return <div className="bg-white rounded-xl ring-1 ring-gray-200 p-10 text-center"><h1 className="text-lg font-semibold text-gray-900">User management unavailable</h1><p className="mt-2 text-sm text-gray-500">Only Super Administrators can manage users.</p></div>;
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();
  const { error } = await searchParams;
  const action = updateUser.bind(null, id);

  return (
    <div className="max-w-2xl space-y-6">
      <div><Link href="/users" className="text-sm text-emerald-700 hover:text-emerald-900">Back to users</Link><h1 className="mt-3 text-2xl font-bold text-gray-900">Edit User</h1><p className="mt-0.5 text-sm text-gray-500">Update account details and access role</p></div>
      {error === "email" && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">That email address is already in use.</div>}
      <form action={action} className="bg-white rounded-xl ring-1 ring-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full name" name="name" defaultValue={user.name} required />
          <Field label="Email" name="email" type="email" defaultValue={user.email} required />
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Role <span className="text-red-500">*</span></label><select name="role" required defaultValue={user.role} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="CHW">Community Health Worker</option><option value="SUPERVISOR">Supervisor</option><option value="ADMIN">Super Administrator</option></select></div>
          <Field label="New password (optional)" name="password" type="password" minLength={8} />
          <Field label="Village / area" name="village" defaultValue={user.village ?? ""} />
          <Field label="Phone" name="phone" type="tel" defaultValue={user.phone ?? ""} />
        </div>
        <div className="flex justify-end gap-3"><Link href="/users" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600">Cancel</Link><button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Save Changes</button></div>
      </form>
    </div>
  );
}

function Field({ label, name, type = "text", defaultValue, required, minLength }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean; minLength?: number }) {
  return <div><label className="mb-1 block text-xs font-medium text-gray-600">{label}{required && <span className="text-red-500"> *</span>}</label><input name={name} type={type} defaultValue={defaultValue} required={required} minLength={minLength} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>;
}
