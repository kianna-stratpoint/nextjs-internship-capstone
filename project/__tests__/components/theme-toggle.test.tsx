import { render, screen, fireEvent } from "@testing-library/react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { useTheme } from "@/components/shared/theme-provider"

jest.mock("@/components/shared/theme-provider", () => ({
  useTheme: jest.fn(),
}))

describe("ThemeToggle Component", () => {
  const mockSetTheme = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders correctly when mounted in light mode", () => {
    // Arrange: Mock light mode
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument()
  })

  it("toggles to dark mode when clicked while in light mode", () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    // Act
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }))

    // Assert
    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })

  it("toggles to light mode when clicked while in dark mode", () => {
    // Arrange: Start in dark mode
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    // Act
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }))

    // Assert
    expect(mockSetTheme).toHaveBeenCalledWith("light")
  })
})
