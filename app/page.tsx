import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UploadCloud, PaletteIcon, ArrowRight } from "lucide-react"
import { PricingSection } from "@/components/pricing/pricing-section"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 bg-gray-100 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 dark:text-gray-50">
                  Streamline Your Direct Mail Campaigns
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl dark:text-gray-400">
                  Create and manage personalized letters and postcards with ease. The Yellow Letter Shop helps you reach
                  your audience effectively.
                </p>
              </div>
              <div className="w-full max-w-4xl pt-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <Link href="/design/customize">
                    <Card className="h-full transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                      <CardHeader className="flex flex-col items-start p-6">
                        <div className="mb-4 rounded-md bg-yellow-400/20 p-3">
                          <UploadCloud className="h-8 w-8 text-yellow-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Got Your Design Ready?</CardTitle>
                        <CardDescription className="text-md text-gray-600 dark:text-gray-400 mt-2">
                          Already have a design? Upload your files and we'll handle the printing and mailing.
                        </CardDescription>
                        <div className="mt-6 flex items-center font-semibold text-yellow-600">
                          Start Uploading <ArrowRight className="ml-2 h-5 w-5" />
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                  <Link href="/templates">
                    <Card className="h-full transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                      <CardHeader className="flex flex-col items-start p-6">
                        <div className="mb-4 rounded-md bg-yellow-400/20 p-3">
                          <PaletteIcon className="h-8 w-8 text-yellow-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Need Some Inspiration?</CardTitle>
                        <CardDescription className="text-md text-gray-600 dark:text-gray-400 mt-2">
                          Browse our library of professionally designed templates to kickstart your campaign.
                        </CardDescription>
                        <div className="mt-6 flex items-center font-semibold text-yellow-600">
                          Explore Templates <ArrowRight className="ml-2 h-5 w-5" />
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <PricingSection />
      </main>
    </div>
  )
}
