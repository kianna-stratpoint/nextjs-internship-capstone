import { User, Bell, Shield, Palette } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">Settings</h1>
        <p className="mt-2 text-payne's_gray-500 dark:text-french_gray-500">
          Manage your account and application preferences
        </p>
      </div>

      {/* Implementation Tasks Banner */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <h3 className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
          ⚙️ Settings Implementation Tasks
        </h3>
        <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
          <li>• Task 2.4: Implement user session management</li>
          <li>• Task 6.4: Implement project member management and permissions</li>
        </ul>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Settings Navigation */}
        <div className="rounded-lg border border-french_gray-300 bg-white p-6 dark:border-payne's_gray-400 dark:bg-outer_space-500">
          <h3 className="mb-4 text-lg font-semibold text-outer_space-500 dark:text-platinum-500">
            Settings
          </h3>
          <nav className="space-y-2">
            {[
              { name: "Profile", icon: User, active: true },
              { name: "Notifications", icon: Bell, active: false },
              { name: "Security", icon: Shield, active: false },
              { name: "Appearance", icon: Palette, active: false },
            ].map((item) => (
              <button
                key={item.name}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-blue_munsell-100 text-blue_munsell-700 dark:bg-blue_munsell-900 dark:text-blue_munsell-300"
                    : "text-outer_space-500 hover:bg-platinum-500 dark:text-platinum-500 dark:hover:bg-payne's_gray-400"
                }`}
              >
                <item.icon className="mr-3" size={16} />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="rounded-lg border border-french_gray-300 bg-white p-6 dark:border-payne's_gray-400 dark:bg-outer_space-500 lg:col-span-2">
          <h3 className="mb-6 text-lg font-semibold text-outer_space-500 dark:text-platinum-500">
            Profile Settings
          </h3>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-outer_space-500 dark:text-platinum-500">
                Full Name
              </label>
              <input
                type="text"
                defaultValue="John Doe"
                className="w-full rounded-lg border border-french_gray-300 bg-white px-3 py-2 text-outer_space-500 focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:border-payne's_gray-400 dark:bg-outer_space-400 dark:text-platinum-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-outer_space-500 dark:text-platinum-500">
                Email Address
              </label>
              <input
                type="email"
                defaultValue="john@example.com"
                className="w-full rounded-lg border border-french_gray-300 bg-white px-3 py-2 text-outer_space-500 focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:border-payne's_gray-400 dark:bg-outer_space-400 dark:text-platinum-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-outer_space-500 dark:text-platinum-500">
                Role
              </label>
              <select className="w-full rounded-lg border border-french_gray-300 bg-white px-3 py-2 text-outer_space-500 focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:border-payne's_gray-400 dark:bg-outer_space-400 dark:text-platinum-500">
                <option>Project Manager</option>
                <option>Developer</option>
                <option>Designer</option>
                <option>QA Engineer</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button className="rounded-lg px-4 py-2 text-payne's_gray-500 transition-colors hover:bg-platinum-500 dark:text-french_gray-400 dark:hover:bg-payne's_gray-400">
                Cancel
              </button>
              <button className="rounded-lg bg-blue_munsell-500 px-4 py-2 text-white transition-colors hover:bg-blue_munsell-600">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
