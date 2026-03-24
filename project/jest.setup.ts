import "@testing-library/jest-dom"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

// Suppress console.error for expected test failures
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("act(")) return
    originalError.call(console, ...args)
  }
})
afterAll(() => {
  console.error = originalError
})
