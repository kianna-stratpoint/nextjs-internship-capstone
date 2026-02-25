// TODO: Task 2.3 - Create sign-in and sign-up pages
export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-platinum-900 px-4 dark:bg-outer_space-600">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
            Create Account
          </h1>
          <p className="text-payne's_gray-500 dark:text-french_gray-400">
            Join our project management platform
          </p>
        </div>

        {/* TODO: Task 2.3 - Replace with actual Clerk SignUp component */}
        <div className="rounded-lg border border-french_gray-300 bg-white p-8 dark:border-payne's_gray-400 dark:bg-outer_space-500">
          <div className="text-center text-payne's_gray-500 dark:text-french_gray-400">
            <p className="mb-4">📝 Clerk Registration Component Placeholder</p>
            <p className="text-sm">TODO: Implement Clerk SignUp component</p>
            <div className="mt-6 rounded border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                📋 <strong>For Interns:</strong> Replace this with {`<SignUp />`} from @clerk/nextjs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/*
TODO: Task 2.3 Implementation Notes:
- Import SignUp from @clerk/nextjs
- Configure sign-up redirects
- Style to match design system
- Add proper error handling
- Set up webhook for user data sync (Task 2.5)
*/
