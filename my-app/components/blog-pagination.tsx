import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BlogPaginationProps {
  currentPage: number
  totalPages: number
}

export default function BlogPagination({ currentPage, totalPages }: BlogPaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []

    // Always show first page
    pages.push(1)

    // Calculate range around current page
    const rangeStart = Math.max(2, currentPage - 1)
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1)

    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push("...")
    }

    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i)
    }

    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push("...")
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex justify-center items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-md border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>

      {pageNumbers.map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
            ...
          </span>
        ) : (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            className={`w-9 h-9 rounded-md ${
              currentPage === page
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
                : "border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {page}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-md border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  )
}
