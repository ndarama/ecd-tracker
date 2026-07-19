import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfile, updatePassword } from "@/actions/account";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface Props {
  searchParams: Promise<{ saved?: string; error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  mismatch: "New passwords do not match.",
  short: "Password must be at least 8 characters.",
  wrong: "Current password is incorrect.",
};

export default async function AccountPage({ searchParams }: Props) {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
  });
  if (!user) return null;

  const { saved, error } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your profile and password
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 ring-1 ring-green-200 rounded-lg text-green-800 text-sm">
          <CheckCircleIcon className="w-5 h-5 shrink-0" />
          Changes saved successfully.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 ring-1 ring-red-200 rounded-lg text-red-800 text-sm">
          <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
          {ERROR_MESSAGES[error] ?? "An error occurred."}
        </div>
      )}

      {/* Profile */}
      <form
        action={updateProfile}
        className="bg-white rounded-xl ring-1 ring-gray-200 p-6 space-y-5"
      >
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Profile
        </h2>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user.name}</p>
            <p className="text-sm text-gray-500">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase().replace("_", " ")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              defaultValue={user.name}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              value={user.email}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Village / Area
            </label>
            <input
              name="village"
              defaultValue={user.village ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              name="phone"
              type="tel"
              defaultValue={user.phone ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Save Profile
          </button>
        </div>
      </form>

      {/* Change password */}
      <form
        action={updatePassword}
        className="bg-white rounded-xl ring-1 ring-gray-200 p-6 space-y-5"
      >
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Change Password
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <input
              name="current"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                name="next"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}
