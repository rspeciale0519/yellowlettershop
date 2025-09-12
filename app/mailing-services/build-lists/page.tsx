"use client"

import { FeatureAuthGuard } from "@/components/auth/FeatureAuthGuard"
import { BuildListLanding } from "@/components/landing-pages/BuildListLanding"
import { ListSummary } from "@/components/list-builder/list-summary"
import { CriteriaAccordion } from "@/components/list-builder/criteria-accordion"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, ShoppingCart, Trash2, Loader2, RefreshCw } from "lucide-react"
import { useBuildListsPage } from "./hooks/useBuildListsPage"
import { FilterPanel } from "./components/FilterPanel"

function BuildListsContent() {
  const {
    listName,
    setListName,
    criteria,
    activeCategory,
    setActiveCategory,
    updateCriteria,
    clearAllCriteria,
    recordCount,
    totalCost,
    estimateLoading,
    estimateError,
    refreshEstimate,
  } = useBuildListsPage()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 w-full">
      {/* Page Header */}
      <div className="mb-8 px-4 pt-8 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Build Your Mailing List</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Use our powerful filters to create a perfectly targeted mailing list for your campaign.
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start px-4 lg:px-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6 sticky top-24">
          <CriteriaAccordion activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          <ListSummary
            listName={listName}
            onNameChange={setListName}
            recordCount={recordCount}
            totalCost={totalCost}
          />
          <Button variant="outline" onClick={clearAllCriteria} className="w-full bg-transparent">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Criteria
          </Button>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-6">
          {/* Error Alert */}
          {estimateError && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>Failed to get real-time estimate: {estimateError}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshEstimate}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <FilterPanel
            activeCategory={activeCategory}
            criteria={criteria}
            updateCriteria={updateCriteria}
          />
        </main>
      </div>

      {/* Floating Action Bar */}
      <div className="sticky bottom-0 left-0 right-0 mt-8 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-end gap-4 px-4 lg:px-8">
          <div className="text-right">
            <p className="font-bold text-lg flex items-center justify-end gap-2">
              {estimateLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {recordCount.toLocaleString()} Records
            </p>
            <p className="text-yellow-600 dark:text-yellow-400 font-semibold text-xl">
              ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <Button variant="outline" size="lg" className="bg-transparent">
            <Save className="h-4 w-4 mr-2" />
            Save Criteria
          </Button>
          <Button 
            size="lg" 
            className=""
            style={{ backgroundColor: '#E0B431', color: '#000' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6CF62'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0B431'}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Purchase List
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function BuildListsPage() {
  return (
    <FeatureAuthGuard
      landingPage={<BuildListLanding />}
      requireAuth={true}
      redirectToAuth={true}
    >
      <BuildListsContent />
    </FeatureAuthGuard>
  )
}
