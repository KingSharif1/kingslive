"use client"

import { X } from "lucide-react"

interface TagKeywordManagerProps {
  items: string[]
  inputValue: string
  setInputValue: (value: string) => void
  handleAdd: () => void
  handleRemove: (item: string) => void
  placeholder: string
  label: string
}

export default function TagKeywordManager({
  items,
  inputValue,
  setInputValue,
  handleAdd,
  handleRemove,
  placeholder,
  label
}: TagKeywordManagerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map(item => (
          <div key={item} className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            <span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span>
            <button
              onClick={() => handleRemove(item)}
              className="ml-2 text-gray-500 hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-xl transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}
