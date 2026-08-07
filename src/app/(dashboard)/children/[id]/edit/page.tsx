import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateChild } from "@/actions/children";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditChildPage({ params }: Props) {
  const { id } = await params;
  const child = await prisma.child.findUnique({ where: { id }, include: { caregiver: true } });
  if (!child) notFound();

  const action = updateChild.bind(null, id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/children/${id}`}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit — {child.firstName} {child.lastName}
          </h1>
        </div>
      </div>

      <form action={action} className="bg-white rounded-xl ring-1 ring-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Child Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              name="firstName"
              required
              defaultValue={child.firstName}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              name="lastName"
              required
              defaultValue={child.lastName}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              name="dateOfBirth"
              type="date"
              required
              defaultValue={format(child.dateOfBirth, "yyyy-MM-dd")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              required
              defaultValue={child.gender}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
          <input
            name="village"
            required
            defaultValue={child.village}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <hr className="border-gray-200" />
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Caregiver</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caregiver Name</label>
            <input
              name="caregiverName"
              required
              defaultValue={child.caregiver?.name ?? child.caregiverName}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              name="caregiverPhone"
              defaultValue={child.caregiver?.phone ?? child.caregiverPhone ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href={`/children/${id}`} className="px-4 py-2 text-sm text-gray-600 font-medium">
            Cancel
          </Link>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
