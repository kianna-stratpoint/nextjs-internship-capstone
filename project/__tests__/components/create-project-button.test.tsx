import { render, screen, fireEvent } from "@testing-library/react"
import { CreateProjectButton } from "@/components/features/projects/create-project-button"
import { useUIStore } from "@/stores/ui-store"

jest.mock("@/stores/ui-store")

describe("CreateProjectButton Component", () => {
  const mockOpenCreateProjectModal = jest.fn()

  beforeEach(() => {
    ;(useUIStore as unknown as jest.Mock).mockImplementation((selector) => {
      const mockState = {
        openCreateProjectModal: mockOpenCreateProjectModal,
      }
      return selector ? selector(mockState) : mockState
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders default text and icon when no children are passed", () => {
    render(<CreateProjectButton />)

    expect(screen.getByRole("button", { name: /new project/i })).toBeInTheDocument()
    expect(document.querySelector("svg")).toBeInTheDocument()
  })

  it("renders custom children instead of default text", () => {
    render(<CreateProjectButton>Custom Start</CreateProjectButton>)

    expect(screen.getByRole("button", { name: /custom start/i })).toBeInTheDocument()
    expect(screen.queryByText("New Project")).not.toBeInTheDocument()
  })

  it("handles click interactions", () => {
    render(<CreateProjectButton />)

    fireEvent.click(screen.getByRole("button", { name: /new project/i }))
    expect(mockOpenCreateProjectModal).toHaveBeenCalledTimes(1)
  })
})
