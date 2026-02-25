"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"

export function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center rounded-lg bg-blue_munsell-500 px-4 py-2 text-white transition-colors hover:bg-blue_munsell-600"
      >
        <Plus size={20} className="mr-2" />
        New Project
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 dark:bg-outer_space-500">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500">
                Create New Project
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-outer_space-500 dark:text-platinum-500">
                  Project Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-french_gray-300 bg-white px-3 py-2 text-outer_space-500 focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:border-payne's_gray-400 dark:bg-outer_space-400 dark:text-platinum-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-outer_space-500 dark:text-platinum-500">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-french_gray-300 bg-white px-3 py-2 text-outer_space-500 focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:border-payne's_gray-400 dark:bg-outer_space-400 dark:text-platinum-500"
                  placeholder="Project description"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-outer_space-500 dark:text-platinum-500">
                  Due Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-french_gray-300 bg-white px-3 py-2 text-outer_space-500 focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:border-payne's_gray-400 dark:bg-outer_space-400 dark:text-platinum-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-2 text-payne's_gray-500 transition-colors hover:bg-platinum-500 dark:text-french_gray-400 dark:hover:bg-payne's_gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue_munsell-500 px-4 py-2 text-white transition-colors hover:bg-blue_munsell-600"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
