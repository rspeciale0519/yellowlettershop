"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Mail, CreditCard, Phone, MapPin, FileText, Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Pricing data from the document
const letterPricing = [
  { quantity: "1 - 249", sc: 1.1, fc: 1.3, shipped_fc: 1.6, shipped_np: 0.65, shipped_po: 0.55 },
  { quantity: "250 - 499", sc: 1.05, fc: 1.25, shipped_fc: 1.55, shipped_np: 0.65, shipped_po: 0.55 },
  { quantity: "500 - 749", sc: 1.02, fc: 1.2, shipped_fc: 1.5, shipped_np: 0.65, shipped_po: 0.55 },
  { quantity: "750 - 999", sc: 0.97, fc: 1.15, shipped_fc: 1.45, shipped_np: 0.65, shipped_po: 0.55 },
  {
    quantity: "1,000 - 2,499",
    sc: 0.87,
    fc: 1.05,
    shipped_fc: 1.35,
    shipped_np: 0.65,
    shipped_po: 0.55,
    popular: true,
  },
  { quantity: "2,500 - 4,999", sc: 0.86, fc: 1.03, shipped_fc: 1.33, shipped_np: 0.65, shipped_po: 0.55 },
  { quantity: "5,000 - 9,999", sc: 0.83, fc: 1.01, shipped_fc: 1.31, shipped_np: 0.65, shipped_po: 0.55 },
  { quantity: "10,000+", sc: 0.8, fc: 0.95, shipped_fc: 1.25, shipped_np: 0.65, shipped_po: 0.55 },
]

const postcardPricing = [
  { size: "4 x 6 First Class", q1: 0.95, q2: 0.95, q3: 0.87, q4: 0.85, q5: 0.79, q6: 0.77, q7: 0.76, q8: 0.72 },
  {
    size: "5 x 7 First Class",
    q1: 1.1,
    q2: 1.1,
    q3: 1.02,
    q4: 1.0,
    q5: 0.94,
    q6: 0.92,
    q7: 0.91,
    q8: 0.9,
    popular: true,
  },
  { size: "5 x 7 Standard Class", q1: 0.95, q2: 0.95, q3: 0.87, q4: 0.85, q5: 0.79, q6: 0.77, q7: 0.76, q8: 0.75 },
  { size: "6 x 9 First Class", q1: 1.12, q2: 1.12, q3: 1.04, q4: 1.02, q5: 0.96, q6: 0.94, q7: 0.93, q8: 0.89 },
  { size: "6 x 9 Standard Class", q1: 0.97, q2: 0.97, q3: 0.89, q4: 0.87, q5: 0.81, q6: 0.79, q7: 0.78, q8: 0.74 },
  { size: "6 x 11 First Class", q1: 1.15, q2: 1.15, q3: 1.07, q4: 1.05, q5: 0.99, q6: 0.97, q7: 0.96, q8: 0.92 },
  { size: "6 x 11 Standard Class", q1: 0.98, q2: 0.98, q3: 0.9, q4: 0.88, q5: 0.82, q6: 0.8, q7: 0.79, q8: 0.75 },
]

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
    <TooltipProvider>
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

            <TabsContent value="letters" className="space-y-6">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-yellow-500" />
                    Letter Pricing
                  </CardTitle>
                  <CardDescription>Pricing per piece based on quantity and delivery method</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Quantity</TableHead>
                          <TableHead className="text-center">
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 mx-auto">
                                Mailed (SC)
                                <Info className="h-3 w-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Standard Class - 200 piece minimum</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-center">
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 mx-auto">
                                Mailed (FC)
                                <Info className="h-3 w-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>First Class - No minimum</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-center">
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 mx-auto">
                                Shipped (FC)
                                <Info className="h-3 w-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Shipped to you with First Class postage</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-center">
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 mx-auto">
                                Shipped (NP)
                                <Info className="h-3 w-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Shipped to you with no postage</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-center">
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 mx-auto">
                                Print Only
                                <Info className="h-3 w-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Print only service</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {letterPricing.map((row, index) => (
                          <TableRow
                            key={index}
                            className={row.popular ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200" : ""}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {row.quantity}
                                {row.popular && (
                                  <Badge variant="secondary" className="bg-yellow-500 text-gray-900">
                                    Most Popular
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-semibold">${row.sc.toFixed(2)}</TableCell>
                            <TableCell className="text-center font-semibold">${row.fc.toFixed(2)}</TableCell>
                            <TableCell className="text-center font-semibold">${row.shipped_fc.toFixed(2)}</TableCell>
                            <TableCell className="text-center font-semibold">${row.shipped_np.toFixed(2)}</TableCell>
                            <TableCell className="text-center font-semibold">${row.shipped_po.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="postcards" className="space-y-6">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-yellow-500" />
                    Postcard Pricing
                  </CardTitle>
                  <CardDescription>Pricing per piece based on size and quantity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Size/Postage</TableHead>
                          <TableHead className="text-center">1-249</TableHead>
                          <TableHead className="text-center">250-499</TableHead>
                          <TableHead className="text-center">500-749</TableHead>
                          <TableHead className="text-center">750-999</TableHead>
                          <TableHead className="text-center">1,000-2,499</TableHead>
                          <TableHead className="text-center">2,500-4,999</TableHead>
                          <TableHead className="text-center">5,000-9,999</TableHead>
                          <TableHead className="text-center">10,000+</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {postcardPricing.map((row, index) => (
                          <TableRow
                            key={index}
                            className={row.popular ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200" : ""}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {row.size}
                                {row.popular && (
                                  <Badge variant="secondary" className="bg-yellow-500 text-gray-900">
                                    Most Popular
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-semibold">${row.q1.toFixed(2)}</TableCell>
                            <TableCell className="text-center font-semibold">${row.q2.toFixed(2)}</TableCell>
                            <TableCell className="text-center font-semibold">${row.q3.toFixed(2)}</TableCell>
                            <TableCell className="text-center font-semibold">${row.q4.toFixed(2)}</TableCell>
                            <TableCell className="text-center font-semibold">${row.q5.toFixed(2)}</TableCell>
                            <TableCell className="text-center font-semibold">${row.q6.toFixed(2)}</TableCell>
                            <TableCell className="text-center font-semibold">${row.q7.toFixed(2)}</TableCell>
                            <TableCell className="text-center font-semibold">${row.q8.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
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
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
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
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 mr-4">
              Start Your Campaign
            </Button>
            <Button size="lg" variant="outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </TooltipProvider>
  )
}
