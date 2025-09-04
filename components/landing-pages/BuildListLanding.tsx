'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MapPin,
  DollarSign,
  Users,
  Target,
  BarChart3,
  Filter,
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BuildListLanding() {
  const router = useRouter();

  const openAuth = (mode: 'login' | 'signup') => {
    const url = new URL(window.location.href);
    url.searchParams.set('auth', mode);
    router.replace(url.pathname + '?' + url.searchParams.toString(), {
      scroll: false,
    });
  };

  const features = [
    {
      icon: Target,
      title: 'Precision Targeting',
      description: 'Filter by demographics, property values, mortgage data, and hundreds of other criteria.'
    },
    {
      icon: MapPin,
      title: 'Geographic Filtering',
      description: 'Target specific neighborhoods, zip codes, cities, or draw custom boundaries on the map.'
    },
    {
      icon: DollarSign,
      title: 'Property Value Filters',
      description: 'Find properties within specific value ranges, equity levels, or market conditions.'
    },
    {
      icon: Users,
      title: 'Demographic Insights',
      description: 'Target by age, income, family size, lifestyle preferences, and consumer behavior.'
    },
    {
      icon: BarChart3,
      title: 'Real-time Estimates',
      description: 'See record counts and pricing estimates update in real-time as you refine your criteria.'
    },
    {
      icon: Zap,
      title: 'Instant Delivery',
      description: 'Get your custom-built, validated lists delivered instantly after purchase.'
    }
  ];

  const benefits = [
    'Access to 200+ million verified records',
    'Save 90% of time vs manual research',
    'Increase response rates by 3-5x',
    'CASS-certified address accuracy',
    'Compliance with all postal regulations',
    'Unlimited list revisions and refinements'
  ];

  const industries = [
    { name: 'Real Estate', description: 'Find motivated sellers, buyers, and investors' },
    { name: 'Insurance', description: 'Target homeowners for coverage opportunities' },
    { name: 'Home Services', description: 'Reach property owners who need your services' },
    { name: 'Financial Services', description: 'Connect with qualified lending prospects' },
    { name: 'Retail', description: 'Target consumers in specific trade areas' },
    { name: 'Healthcare', description: 'Reach patients in your service area' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 dark:from-blue-600/10 dark:to-indigo-800/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-500 text-white hover:bg-blue-600">
              <Search className="w-4 h-4 mr-2" />
              Professional List Building
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Build Perfect Mailing Lists
              <span className="block text-blue-600 dark:text-blue-400">In Minutes, Not Hours</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Access 200+ million records and build highly targeted mailing lists with our advanced filtering system. 
              Perfect for real estate, insurance, home services, and more.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-8 py-6"
                onClick={() => openAuth('signup')}
              >
                Start Building Lists
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => openAuth('login')}
              >
                Sign In
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                200M+ records
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Real-time pricing
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Instant download
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Filtering & Targeting Tools
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Build laser-focused mailing lists with our comprehensive filtering system and real-time data.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Perfect for Every Industry
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Whether you're in real estate, insurance, or home services, our list builder has you covered.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600 dark:text-blue-400">{industry.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{industry.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Why Our List Builder Outperforms the Competition
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Don't waste time with outdated databases or inaccurate information. Get the most current, 
                accurate data available anywhere.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">List Quality Metrics</h3>
                  <Badge className="bg-white/20 text-white">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Industry Leading
                  </Badge>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/90">Data Accuracy</span>
                      <span className="font-semibold">99.3%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full" style={{ width: '99.3%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/90">Delivery Rate</span>
                      <span className="font-semibold">97.8%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '97.8%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/90">Response Rate</span>
                      <span className="font-semibold">4.2%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: '84%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm text-white/80">
                    *Industry average response rate is 1.3%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Transparent, Competitive Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Pay only for what you need. No monthly fees, no commitments.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-lg">Starter</CardTitle>
                <CardDescription>Perfect for small campaigns</CardDescription>
                <div className="text-2xl font-bold text-blue-600">$0.08<span className="text-sm text-gray-500">/record</span></div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  1,000 - 10,000 records
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-500 border-2 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                Most Popular
              </Badge>
              <CardHeader>
                <CardTitle className="text-lg">Professional</CardTitle>
                <CardDescription>Best value for most users</CardDescription>
                <div className="text-2xl font-bold text-blue-600">$0.06<span className="text-sm text-gray-500">/record</span></div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  10,001 - 50,000 records
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enterprise</CardTitle>
                <CardDescription>For large-scale operations</CardDescription>
                <div className="text-2xl font-bold text-blue-600">$0.04<span className="text-sm text-gray-500">/record</span></div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  50,000+ records
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Start Building Better Lists Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of successful marketers. Try our list builder risk-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white hover:bg-gray-100 text-blue-600 text-lg px-8 py-6"
              onClick={() => openAuth('signup')}
            >
              <Star className="mr-2 h-5 w-5" />
              Try It Free
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6"
              onClick={() => openAuth('login')}
            >
              <Filter className="mr-2 h-5 w-5" />
              Sign In
            </Button>
          </div>
          <div className="mt-6 text-sm text-blue-200">
            No credit card required • Cancel anytime • Get started in 30 seconds
          </div>
        </div>
      </section>
    </div>
  );
}