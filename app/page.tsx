import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { UploadCloud, PaletteIcon, ArrowRight, Palette, Search } from 'lucide-react';
import { PricingSection } from '@/components/pricing/pricing-section';
import { AmbientBackground } from '@/components/ambient-background';
import { HandwritingBackground } from '@/components/handwriting-background/HandwritingBackground';

export default async function HomePage() {
  // Check if user is authenticated and redirect to dashboard
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Only redirect if we have a valid user with no errors
    if (user && !error) {
      redirect('/dashboard');
    }
  } catch (error) {
    // Silently handle redirect operations - they're expected
  }
  return (
    <div className='relative flex flex-col min-h-screen'>
      <AmbientBackground />
      <HandwritingBackground />
      <main className='relative flex-1' style={{ zIndex: 10 }}>
        <section className='w-full py-20 md:py-32 lg:py-40'>
          <div className='container px-4 md:px-6'>
            <div className='flex flex-col items-center space-y-6 text-center'>
              <div className='space-y-4'>
                <h1 className='text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 dark:text-gray-50'>
                  Streamline Your Direct Mail Campaigns
                </h1>
                <p className='mx-auto max-w-[700px] text-gray-600 md:text-xl dark:text-gray-400'>
                  Create and manage personalized letters and postcards with
                  ease. The Yellow Letter Shop helps you reach your audience
                  effectively.
                </p>
              </div>
              <div className='w-full max-w-4xl pt-8'>
                <div className='grid gap-6 md:grid-cols-2'>
                  <Link href='/design/customize'>
                    <Card 
                      className='group h-full transform transition-all duration-500 ease-out hover:-translate-y-3 hover:shadow-2xl hover:[box-shadow:_0_0_20px_rgba(246,207,98,0.3),_0_8px_32px_rgba(0,0,0,0.12)] dark:hover:shadow-[#F6CF62]/20 hover:border-[#F6CF62] dark:hover:bg-gradient-to-br dark:hover:from-[#2A2817] dark:hover:to-[#2D2B1A] hover:scale-[1.02] focus-within:ring-2 focus-within:ring-[#F6CF62] focus-within:ring-opacity-50'
                    >
                      <CardHeader className='flex flex-col items-center text-center p-6 relative overflow-hidden'>
                        <div className='mb-4 rounded-md bg-yellow-400/20 p-3 group-hover:bg-yellow-400/30 group-hover:scale-110 transition-all duration-300 delay-75'>
                          <Palette className='h-8 w-8 text-yellow-500 group-hover:text-yellow-600 transition-colors duration-300' />
                        </div>
                        <CardTitle className='text-2xl font-bold group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-300 delay-100 [text-shadow:_0_1px_2px_rgb(0_0_0_/_10%)] group-hover:[text-shadow:_0_1px_3px_rgb(0_0_0_/_20%)]'>
                          Start a New Design
                        </CardTitle>
                        <CardDescription className='text-md text-gray-600 dark:text-gray-400 mt-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300 delay-150 [text-shadow:_0_1px_1px_rgb(0_0_0_/_8%)] group-hover:[text-shadow:_0_1px_2px_rgb(0_0_0_/_15%)]'>
                          Already have a design or want to start fresh? Create something new or upload your own files.
                        </CardDescription>
                        <div className='mt-6 flex items-center font-semibold text-yellow-600 group-hover:text-[#F6CF62] transition-all duration-500 ease-out group-hover:scale-[1.02] [text-shadow:_0_1px_1px_rgb(0_0_0_/_10%)] group-hover:[text-shadow:_none]'>
                          Get Started{' '}
                          <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-500 ease-out' />
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                  <Link href='/templates'>
                    <Card 
                      className='group h-full transform transition-all duration-500 ease-out hover:-translate-y-3 hover:shadow-2xl hover:[box-shadow:_0_0_20px_rgba(246,207,98,0.3),_0_8px_32px_rgba(0,0,0,0.12)] dark:hover:shadow-[#F6CF62]/20 hover:border-[#F6CF62] dark:hover:bg-gradient-to-br dark:hover:from-[#2A2817] dark:hover:to-[#2D2B1A] hover:scale-[1.02] focus-within:ring-2 focus-within:ring-[#F6CF62] focus-within:ring-opacity-50'
                    >
                      <CardHeader className='flex flex-col items-center text-center p-6 relative overflow-hidden'>
                        <div className='mb-4 rounded-md bg-yellow-400/20 p-3 group-hover:bg-yellow-400/30 group-hover:scale-110 transition-all duration-300 delay-75'>
                          <Search className='h-8 w-8 text-yellow-500 group-hover:text-yellow-600 transition-colors duration-300' />
                        </div>
                        <CardTitle className='text-2xl font-bold group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-300 delay-100 [text-shadow:_0_1px_2px_rgb(0_0_0_/_10%)] group-hover:[text-shadow:_0_1px_3px_rgb(0_0_0_/_20%)]'>
                          Get Some Inspiration
                        </CardTitle>
                        <CardDescription className='text-md text-gray-600 dark:text-gray-400 mt-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300 delay-150 [text-shadow:_0_1px_1px_rgb(0_0_0_/_8%)] group-hover:[text-shadow:_0_1px_2px_rgb(0_0_0_/_15%)]'>
                          Browse our library of professionally designed
                          templates to kickstart your campaign.
                        </CardDescription>
                        <div className='mt-6 flex items-center font-semibold text-yellow-600 group-hover:text-[#F6CF62] transition-all duration-500 ease-out group-hover:scale-[1.02] [text-shadow:_0_1px_1px_rgb(0_0_0_/_10%)] group-hover:[text-shadow:_none]'>
                          Browse Templates{' '}
                          <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-500 ease-out' />
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className='relative z-10 -mt-16'>
          <div className='pt-16 pb-0'>
            <PricingSection />
          </div>
        </div>
      </main>
    </div>
  );
}
