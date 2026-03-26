'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, FileText, Users, Palette } from 'lucide-react';
import Link from 'next/link';

/**
 * New Campaign page - protected route that requires authentication
 * Shows campaign creation options and guides users through the process
 */
export default function NewCampaignPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Redirect to home with auth modal
          router.replace('/?auth=login&redirectedFrom=/new-campaign');
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.replace('/?auth=login&redirectedFrom=/new-campaign');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Campaign</h1>
        <p className="text-muted-foreground">
          Get started with your direct mail campaign. Choose your approach below.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Start Option */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-yellow-500" />
              <CardTitle>Quick Start</CardTitle>
            </div>
            <CardDescription>
              Create a campaign with an existing mailing list and template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href="/orders/new?source=dashboard_create_new">
                Start Campaign
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Build New List Option */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <CardTitle>Build New List</CardTitle>
            </div>
            <CardDescription>
              Create a targeted mailing list using our list builder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/mailing-services/build-lists">
                Build List First
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Custom Design Option */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              <CardTitle>Custom Design</CardTitle>
            </div>
            <CardDescription>
              Create a custom design for your direct mail piece
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/design/customize">
                Design First
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Template Gallery Option */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer md:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <CardTitle>Browse Templates</CardTitle>
            </div>
            <CardDescription>
              Choose from our library of proven templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/templates">
                View Templates
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <div className="mt-12 p-6 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Need Help Getting Started?</h2>
        <p className="text-muted-foreground mb-4">
          Not sure which option to choose? Here's a quick guide:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Quick Start:</strong> Perfect if you already have a mailing list and design ready</li>
          <li>• <strong>Build New List:</strong> Start here if you need to create a targeted audience</li>
          <li>• <strong>Custom Design:</strong> Choose this for completely custom mail pieces</li>
          <li>• <strong>Browse Templates:</strong> Great for proven designs you can customize</li>
        </ul>
      </div>
    </div>
  );
}
