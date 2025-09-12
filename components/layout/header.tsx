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
  Menu,
  List,
  Users,
  FileText,
  DollarSign,
  Palette,
  Shield,
  Bell,
  LayoutDashboard,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { handleProtectedAction } from '@/lib/auth/auth-utils';

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const supabase = createClient();
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
      }
    };
    
    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener);
  }, [user]);

  const navLinks = [
    { href: '/design/customize', label: 'New Design', icon: Palette, requiresAuth: true },
    { href: '/templates', label: 'Templates', icon: FileText, requiresAuth: false },
    {
      href: '/mailing-services/build-lists',
      label: 'Build a List',
      icon: List,
      requiresAuth: true,
    },
    {
      href: '/mailing-services/mailing-list-manager',
      label: 'Mailing List Manager',
      icon: Users,
      requiresAuth: true,
    },
    { href: '/#pricing', label: 'Pricing', icon: DollarSign, requiresAuth: false },
  ];

  // Check for existing user session on component mount
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    
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
    subscription = supabase.auth.onAuthStateChange((event, session) => {
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
  }, [router]);


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
            width={180}
            height={40}
            className='hidden sm:block'
          />
          <Image
            src='/yls-logo.png'
            alt='Yellow Letter Shop Logo'
            width={32}
            height={32}
            className='sm:hidden'
          />
        </Link>

        <nav className='hidden md:flex items-center gap-6 text-sm font-medium'>
          {navLinks.map((link) => {
            const IconComponent = link.icon;
            
            // Special handling for Pricing link
            if (link.label === 'Pricing') {
              return (
                <button
                  key={link.href}
                  className='flex items-center gap-2 transition-all duration-200 ease-in-out hover:text-yellow-500 group bg-transparent border-none cursor-pointer text-sm font-medium'
                  onClick={() => {
                    console.log('Pricing button clicked');
                    window.location.href = '/#pricing';
                  }}
                >
                  <IconComponent className='h-4 w-4 transition-all duration-200 ease-in-out text-inherit group-hover:text-yellow-500' />
                  <span className='transition-all duration-200 ease-in-out text-inherit group-hover:text-yellow-500'>
                    {link.label}
                  </span>
                </button>
              );
            }
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className='flex items-center gap-2 transition-all duration-200 ease-in-out hover:text-yellow-500 group'
                onClick={(e) => {
                  console.log('Desktop nav clicked:', link.label, link.href);
                  handleNavClick(e, link);
                }}
              >
                <IconComponent className='h-4 w-4 transition-all duration-200 ease-in-out text-inherit group-hover:text-yellow-500' />
                <span className='transition-all duration-200 ease-in-out text-inherit group-hover:text-yellow-500'>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

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
              <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard/notifications">
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
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
                          (user.user_metadata?.avatar_url as string) ||
                          '/placeholder-user.jpg'
                        }
                        alt={
                          (user.user_metadata?.name as string) ||
                          (user.email as string) ||
                          'User'
                        }
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
                  <DropdownMenuItem>
                    <CreditCard className='mr-2 h-4 w-4' />
                    <span>Identity Cards</span>
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

          <div className='md:hidden'>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon'>
                  <Menu className='h-6 w-6' />
                  <span className='sr-only'>Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side='right'>
                <div className='grid gap-4 py-6'>
                  {navLinks.map((link) => {
                    const IconComponent = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className='flex w-full items-center gap-3 py-2 text-lg font-semibold'
                        onClick={(e) => {
                          if (link.label === 'Pricing') {
                            e.preventDefault();
                            router.push('/#pricing');
                          } else {
                            handleNavClick(e, link);
                          }
                        }}
                      >
                        <IconComponent className='h-5 w-5' />
                        {link.label}
                      </Link>
                    );
                  })}
                  {isHydrated && !isLoading && !user && (
                    <>
                      <Button
                        variant='outline'
                        className='w-full bg-transparent'
                        onClick={() => openAuth('login')}
                      >
                        Sign In
                      </Button>
                      <Button
                        className='w-full'
                        style={{ backgroundColor: '#E0B431', color: '#000' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6CF62'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0B431'}
                        onClick={() => openAuth('signup')}
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                  <Button
                    className='w-full'
                    style={{ backgroundColor: '#E0B431', color: '#000' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6CF62'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0B431'}
                    onClick={handleNewCampaign}
                  >
                    New Campaign
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
