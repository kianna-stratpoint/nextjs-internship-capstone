import { render, screen } from "@testing-library/react"

// A simple dummy component to test
function SampleComponent() {
  return (
    <div>
      <h1>Hello, FLOE!</h1>
      <p>Testing is working.</p>
    </div>
  )
}

describe("Sample Unit Test", () => {
  it("renders a heading with the correct text", () => {
    // 1. Arrange: Render the component
    render(<SampleComponent />)

    // 2. Act: Find the element on the screen
    const heading = screen.getByRole("heading", { name: /Hello, FLOE!/i })

    // 3. Assert: Check if it exists in the document
    expect(heading).toBeInTheDocument()
  })
})
