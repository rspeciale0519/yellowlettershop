'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User as UserIcon,
  CreditCard,
  Settings,
  LogOut,
  Shield,
  LayoutDashboard,
} from 'lucide-react';
import { DesktopNavigation, MobileNavigation, headerNavLinks } from './header-navigation';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { handleProtectedAction } from '@/lib/auth/auth-utils';

export function Header() {
  const pathname = usePathname();
  if (pathname === '/design/customize') return null;
  return <SiteHeader />;
}

function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  // Ensure hydration is complete before showing auth-dependent UI
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsAtTop(window.scrollY < 8);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      const { avatarUrl } = event.detail;
      if (user) {
        setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: avatarUrl } });
        setAvatarTimestamp(Date.now());
      }
    };
    
    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener);
  }, [user]);

  const navLinks = headerNavLinks;

  // Check for existing user session on component mount
  useEffect(() => {
    const init = async () => {
      try {
        // Use a faster initial check that doesn't block rendering
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error fetching auth session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Don't block initial render - start with optimistic loading state
    setIsLoading(true);
    
    // Set up auth state listener first
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsLoading(false); // Ensure loading is false on any auth change
      
      // Let the auth modal handle redirects - just clean up here
      if (event === 'SIGNED_IN' && currentUser) {
        const url = new URL(window.location.href);
        const hasAuthParam = url.searchParams.has('auth');
        
        // Only clean up auth query parameters, don't redirect
        if (hasAuthParam) {
          // Clear auth query parameters after a brief delay to let modal redirect first
          setTimeout(() => {
            if (window.location.search.includes('auth=')) {
              const cleanUrl = new URL(window.location.href);
              cleanUrl.searchParams.delete('auth');
              cleanUrl.searchParams.delete('redirectedFrom');
              window.history.replaceState({}, '', cleanUrl.pathname + (cleanUrl.search || ''));
            }
          }, 100);
        }
      }
    }).data.subscription;

    // Then initialize auth state asynchronously
    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [router, supabase.auth]);


  // Open global auth modal with desired mode
  const openAuth = (
    mode: 'login' | 'signup' | 'forgot' | 'reset' | 'verify' | 'change'
  ) => {
    const url = new URL(window.location.href);
    url.searchParams.set('auth', mode);
    router.replace(url.pathname + '?' + url.searchParams.toString(), {
      scroll: false,
    });
  };

  // Handle logout
  const handleLogout = () => {
    if (!supabase) return;
    supabase.auth
      .signOut()
      .then(() => {
        setUser(null);
        // Use router.push to avoid theme flickering from full page reload
        router.push('/');
      })
      .catch((error) => {
        console.error('Error during sign out:', error);
      });
  };

  // Handle New Campaign button click
  const handleNewCampaign = () => {
    handleProtectedAction(
      () => {
        router.push('/new-campaign');
      },
      router,
      'login',
      '/new-campaign'
    );
  };

  // Handle protected navigation link clicks
  const handleNavClick = (e: React.MouseEvent, link: typeof navLinks[0]) => {
    // Special handling for Pricing link - always go to homepage with pricing anchor
    if (link.label === 'Pricing') {
      e.preventDefault();
      router.push('/#pricing');
      return;
    }

    if (link.requiresAuth) {
      e.preventDefault();
      handleProtectedAction(
        () => {
          router.push(link.href);
        },
        router,
        'login',
        link.href
      );
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isAtTop
          ? 'bg-transparent border-none'
          : 'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
      }`}
      style={
        isAtTop
          ? {
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
            }
          : {}
      }
    >
      <div className='flex h-16 items-center justify-between px-4 md:px-6 py-0 my-2.5 w-full'>
        <Link href='/' className='flex items-center gap-2'>
          <Image
            src='/yls-logo.png'
            alt='Yellow Letter Shop Logo'
            width={688}
            height={227}
            className='h-10 w-auto sm:h-12'
            style={{ width: 'auto' }}
            priority
          />
        </Link>

        <DesktopNavigation navLinks={navLinks} handleNavClick={handleNavClick} />

        <div className='flex items-center gap-4'>
          {/* Always show New Campaign button */}
          <Button
            className='hidden sm:inline-flex'
            style={{ backgroundColor: '#E0B431', color: '#000' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6CF62'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0B431'}
            onClick={handleNewCampaign}
          >
            New Campaign
          </Button>
          
          {/* Show loading state before hydration completes */}
          {!isHydrated || isLoading ? (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="w-20 h-9 rounded bg-muted animate-pulse" />
              <div className="w-24 h-9 rounded bg-muted animate-pulse" />
            </div>
          ) : user ? (
            <>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='relative h-10 w-10 rounded-full'
                  >
                    <Avatar className='h-10 w-10'>
                      <AvatarImage
                        src={
                          user.user_metadata?.avatar_url 
                            ? `${user.user_metadata.avatar_url}?t=${avatarTimestamp}`
                            : '/placeholder-user.jpg'
                        }
                        alt={
                          (user.user_metadata?.name as string) ||
                          (user.email as string) ||
                          'User'
                        }
                        key={user.user_metadata?.avatar_url}
                      />
                      <AvatarFallback>
                        <UserIcon className='h-6 w-6' />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-56'
                  align='end'
                  forceMount
                >
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>
                        {(user.user_metadata?.name as string) || 'User'}
                      </p>
                      <p className='text-xs leading-none text-muted-foreground'>
                        {user.email as string}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center cursor-pointer">
                      <LayoutDashboard className='mr-2 h-4 w-4' />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center cursor-pointer">
                      <UserIcon className='mr-2 h-4 w-4' />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/security" className="flex items-center cursor-pointer">
                      <Shield className='mr-2 h-4 w-4' />
                      <span>Security</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/contact-cards" className="flex items-center cursor-pointer">
                      <CreditCard className='mr-2 h-4 w-4' />
                      <span>Contact Cards</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className='mr-2 h-4 w-4' />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className='mr-2 h-4 w-4' />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button
                variant='outline'
                className='hidden sm:inline-flex bg-transparent'
                onClick={() => openAuth('login')}
              >
                Sign In
              </Button>
              <Button
                className='hidden sm:inline-flex'
                style={{ backgroundColor: '#E0B431', color: '#000' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6CF62'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0B431'}
                onClick={() => openAuth('signup')}
              >
                Get Started
              </Button>
            </>
          )}

          <MobileNavigation navLinks={navLinks} handleNavClick={handleNavClick} showAuth={isHydrated && !isLoading && !user} openAuth={openAuth} handleNewCampaign={handleNewCampaign} onPricing={() => router.push('/#pricing')} />
        </div>
      </div>
    </header>
  );
}
