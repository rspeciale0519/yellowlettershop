"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Home, UserCircle, Landmark, Gavel, BrainCircuit, SlidersHorizontal } from "lucide-react"
import type React from "react"

const categories: { id: string; name: string; icon: React.ElementType }[] = [
  { id: "geography", name: "Geography", icon: MapPin },
  { id: "property", name: "Property", icon: Home },
  { id: "demographics", name: "Demographics", icon: UserCircle },
  { id: "mortgage", name: "Mortgage", icon: Landmark },
  { id: "foreclosure", name: "Foreclosure", icon: Gavel },
  { id: "predictive", name: "Predictive", icon: BrainCircuit },
  { id: "options", name: "Options", icon: SlidersHorizontal },
]

interface CriteriaAccordionProps {
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
}

export function CriteriaAccordion({ activeCategory, onCategoryChange }: CriteriaAccordionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Criteria</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion
          type="single"
          collapsible
          className="w-full"
          value={activeCategory}
          onValueChange={(value) => onCategoryChange(value)}
        >
          {categories.map((category) => (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <div className="flex items-center gap-3">
                  <category.icon
                    className={`h-5 w-5 ${
                      activeCategory === category.id ? "text-yellow-500" : "text-gray-500 dark:text-gray-400"
                    }`}
                  />
                  {category.name}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 text-sm text-gray-600 dark:text-gray-400">
                Select filters to target properties by {category.name.toLowerCase()}.
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
