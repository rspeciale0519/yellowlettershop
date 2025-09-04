'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Upload,
  Shield,
  BarChart3,
  Filter,
  Download,
  Search,
  Tags,
  CheckCircle,
  Star,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function MailingListManagerLanding() {
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
      icon: Upload,
      title: 'Easy Upload & Import',
      description: 'Upload CSV, Excel files or import from multiple data sources with intelligent column mapping.'
    },
    {
      icon: Shield,
      title: 'Data Validation & Cleaning',
      description: 'Automatically validate addresses, remove duplicates, and ensure CASS-certified accuracy.'
    },
    {
      icon: Filter,
      title: 'Advanced Filtering',
      description: 'Filter and segment your lists with powerful search and filtering tools.'
    },
    {
      icon: Tags,
      title: 'Smart Tagging System',
      description: 'Organize contacts with custom tags and categories for better campaign targeting.'
    },
    {
      icon: BarChart3,
      title: 'Campaign Analytics',
      description: 'Track campaign performance and see which contacts have been used in previous mailings.'
    },
    {
      icon: Download,
      title: 'Export & Integration',
      description: 'Export your refined lists in multiple formats or integrate with your favorite tools.'
    }
  ];

  const benefits = [
    'Save hours of manual data cleaning',
    'Increase delivery rates by up to 40%',
    'Reduce campaign costs with better targeting',
    'Comply with postal regulations automatically',
    'Track ROI across all your campaigns',
    'Scale your operations effortlessly'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 dark:from-yellow-600/10 dark:to-orange-700/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge className="mb-4 bg-yellow-500 text-gray-900 hover:bg-yellow-600">
              <Users className="w-4 h-4 mr-2" />
              Professional Mailing List Management
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Manage Your Mailing Lists
              <span className="block text-yellow-600 dark:text-yellow-400">Like a Pro</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Upload, clean, organize, and optimize your mailing lists with enterprise-grade tools. 
              Increase your campaign success rates while saving time and money.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 text-lg px-8 py-6"
                onClick={() => openAuth('signup')}
              >
                Start Free Trial
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
                No setup fees
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Cancel anytime
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                CASS certified
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
              Everything You Need to Manage Lists
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Professional-grade tools that make mailing list management simple, accurate, and effective.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
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

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Why Choose Our Mailing List Manager?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Join thousands of successful marketers who trust our platform to manage their most important asset - their mailing lists.
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
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Campaign Performance</h3>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    +24% improvement
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Delivery Rate</span>
                    <span className="font-semibold">96.3%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '96.3%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Data Accuracy</span>
                    <span className="font-semibold">99.1%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '99.1%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-500 to-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Mailing Lists?
          </h2>
          <p className="text-xl text-gray-800 mb-8">
            Join thousands of successful marketers. Start your free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gray-900 hover:bg-gray-800 text-white text-lg px-8 py-6"
              onClick={() => openAuth('signup')}
            >
              <Star className="mr-2 h-5 w-5" />
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white text-lg px-8 py-6"
              onClick={() => openAuth('login')}
            >
              <Users className="mr-2 h-5 w-5" />
              Sign In
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}