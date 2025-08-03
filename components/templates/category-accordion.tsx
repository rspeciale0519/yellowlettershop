"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, Folder, FolderOpen } from "lucide-react"
import type { TemplateCategory } from "@/data/templates-data"

interface CategoryAccordionProps {
  categories: TemplateCategory[]
  selectedCategory: string
  expandedCategories: string[]
  onCategorySelect: (categoryId: string) => void
  onCategoryToggle: (categoryId: string) => void
}

export function CategoryAccordion({
  categories,
  selectedCategory,
  expandedCategories,
  onCategorySelect,
  onCategoryToggle,
}: CategoryAccordionProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Categories</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {/* All Templates Option */}
          <Button
            variant={selectedCategory === "all" ? "secondary" : "ghost"}
            className={`w-full justify-start h-auto p-3 ${
              selectedCategory === "all"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            onClick={() => onCategorySelect("all")}
            aria-pressed={selectedCategory === "all"}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>All Templates</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {categories.reduce((total, cat) => total + cat.templateCount, 0)}
              </Badge>
            </div>
          </Button>

          {/* Category Accordion */}
          <Accordion
            type="multiple"
            value={expandedCategories}
            onValueChange={(values) => {
              // Handle accordion state changes
              const newExpanded = values as string[]
              const currentExpanded = expandedCategories

              // Find which category was toggled
              const added = newExpanded.find((id) => !currentExpanded.includes(id))
              const removed = currentExpanded.find((id) => !newExpanded.includes(id))

              if (added) onCategoryToggle(added)
              if (removed) onCategoryToggle(removed)
            }}
            className="w-full"
          >
            {categories.map((category) => (
              <AccordionItem key={category.id} value={category.id} className="border-0">
                <AccordionTrigger
                  className={`hover:no-underline p-3 rounded-md transition-colors ${
                    expandedCategories.includes(category.id)
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                  aria-label={`Toggle ${category.name} category`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {expandedCategories.includes(category.id) ? (
                        <FolderOpen className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <Folder className="h-4 w-4" />
                      )}
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {category.templateCount}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-1 ml-6">
                    {/* Main Category Button */}
                    <Button
                      variant={selectedCategory === category.id ? "secondary" : "ghost"}
                      className={`w-full justify-start h-auto p-2 text-sm ${
                        selectedCategory === category.id
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => onCategorySelect(category.id)}
                      aria-pressed={selectedCategory === category.id}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>All {category.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {category.templateCount}
                        </Badge>
                      </div>
                    </Button>

                    {/* Subcategories */}
                    {category.subcategories?.map((subcategory) => (
                      <Button
                        key={subcategory.id}
                        variant={selectedCategory === subcategory.id ? "secondary" : "ghost"}
                        className={`w-full justify-start h-auto p-2 text-sm ${
                          selectedCategory === subcategory.id
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => onCategorySelect(subcategory.id)}
                        aria-pressed={selectedCategory === subcategory.id}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3 w-3" />
                            <span>{subcategory.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {subcategory.templateCount}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  )
}
