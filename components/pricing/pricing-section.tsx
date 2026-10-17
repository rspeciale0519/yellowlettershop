"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PublishedLetterPricing, PublishedPostcardPricing } from "./published-pricing-tables"
import { Mail, Phone, MapPin, FileText, Search } from "lucide-react"

const ancillaryServices = [
  {
    name: "Mailing Lists",
    price: "$0.12/record",
    description: "Less saturated lists with free demographic filters",
    icon: <Mail className="h-5 w-5" />,
    details: "Email Sales@YellowLetterShop.com for custom quotes",
  },
  {
    name: "Skip Tracing",
    price: "$0.10/record",
    description: "Phone numbers and emails for prospects and family",
    icon: <Phone className="h-5 w-5" />,
    details: "Most up-to-date contact information available",
  },
  {
    name: "Mail Tracking",
    price: "$25/mailing",
    description: "Track every piece with alerts and analytics",
    icon: <MapPin className="h-5 w-5" />,
    details: "Text/email alerts, charts, geo-mapping, and data downloads",
  },
  {
    name: "List Formatting",
    price: "$0.05/record",
    description: "Proper capitalization and column corrections",
    icon: <FileText className="h-5 w-5" />,
    details: "Automatic USPS address validation included at no charge",
  },
  {
    name: "List Parsing",
    price: "$0.25/record",
    description: "Address extraction and name separation",
    icon: <Search className="h-5 w-5" />,
    details: "First, middle, and last name extraction when possible",
  },
]

export function PricingSection() {
  const [activeTab, setActiveTab] = useState("letters")

  return (
      <section id="pricing" className="w-full py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900 dark:text-gray-50">
              Transparent Pricing
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl dark:text-gray-400">
              Choose the perfect plan for your direct mail campaigns. No hidden fees, no surprises.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger
                value="letters"
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900"
              >
                Letters
              </TabsTrigger>
              <TabsTrigger
                value="postcards"
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900"
              >
                Postcards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="letters" className="space-y-6"><PublishedLetterPricing /></TabsContent>
            <TabsContent value="postcards" className="space-y-6"><PublishedPostcardPricing /></TabsContent>
          </Tabs>

          {/* Ancillary Services Section */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl text-gray-900 dark:text-gray-50 mb-4">
                Additional Services
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enhance your campaigns with our professional add-on services
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ancillaryServices.map((service, index) => (
                <Card key={index} className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-yellow-400/20 p-2">{service.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <div className="text-2xl font-bold text-yellow-600">{service.price}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{service.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{service.details}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Special Offer Section */}
          <Card className="mt-12 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">🎉 NEW SERVICES AVAILABLE!</h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                Ask us about Customized Digital Marketing & Addressable GeoFencing
              </p>
              <Button 
                size="lg" 
                className=""
                style={{ backgroundColor: '#E0B431', color: '#000' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6CF62'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0B431'}
              >
                Learn More
              </Button>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              *All prices are subject to change based on market conditions and USPS postage price fluctuations.
            </p>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <Button 
              size="lg" 
              className="mr-4"
              style={{ backgroundColor: '#E0B431', color: '#000' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6CF62'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0B431'}
            >
              Start Your Campaign
            </Button>
            <Button size="lg" variant="outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
  )
}
