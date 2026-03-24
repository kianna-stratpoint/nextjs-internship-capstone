import { render, screen, fireEvent } from "@testing-library/react"
import { CreateTaskButton } from "@/components/features/tasks/create-task-button"

import { useUIStore } from "@/stores/ui-store"

jest.mock("@/stores/ui-store")

describe("CreateTaskButton Component", () => {
  const mockOpenCreateTaskModal = jest.fn()

  beforeEach(() => {
    ;(useUIStore as unknown as jest.Mock).mockReturnValue({
      openCreateTaskModal: mockOpenCreateTaskModal,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders children correctly", () => {
    render(<CreateTaskButton>Add New Task</CreateTaskButton>)

    const button = screen.getByRole("button", { name: /add new task/i })
    expect(button).toBeInTheDocument()
  })

  it("calls openCreateTaskModal when clicked", () => {
    render(<CreateTaskButton>Add New Task</CreateTaskButton>)

    fireEvent.click(screen.getByRole("button", { name: /add new task/i }))

    expect(mockOpenCreateTaskModal).toHaveBeenCalledTimes(1)
  })

  it("matches snapshot", () => {
    const { container } = render(<CreateTaskButton>Add New Task</CreateTaskButton>)
    expect(container).toMatchSnapshot()
  })
})
