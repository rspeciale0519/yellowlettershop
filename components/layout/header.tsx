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
  User,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  List,
  Users,
  FileText,
  DollarSign,
  Palette,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsAtTop(window.scrollY < 8);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/design/customize', label: 'New Design', icon: Palette },
    { href: '/templates', label: 'Templates', icon: FileText },
    {
      href: '/mailing-services/build-lists',
      label: 'Build a List',
      icon: List,
    },
    {
      href: '/mailing-services/mailing-list-manager',
      label: 'Mailing List Manager',
      icon: Users,
    },
    { href: '/#pricing', label: 'Pricing', icon: DollarSign },
  ];

  // Check for existing user session on component mount
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user ?? null);
      } catch (error) {
        console.error('Error fetching auth user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Handle successful login
  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  // Open global auth modal with desired mode
  const openAuth = (mode: 'login' | 'signup' | 'forgot' | 'reset' | 'verify' | 'change') => {
    const url = new URL(window.location.href);
    url.searchParams.set('auth', mode);
    router.replace(url.pathname + '?' + url.searchParams.toString(), { scroll: false });
  };

  // Handle logout
  const handleLogout = () => {
    supabase.auth
      .signOut()
      .then(() => {
        setUser(null);
        window.location.href = '/';
      })
      .catch((error) => {
        console.error('Error during sign out:', error);
      });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${isAtTop ? 'bg-transparent border-none' : 'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'}`}
      style={isAtTop ? {background: 'transparent', border: 'none', boxShadow: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none'} : {}}
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
            src='/yls-logo-icon.png'
            alt='Yellow Letter Shop Logo'
            width={32}
            height={32}
            className='sm:hidden'
          />
        </Link>

        <nav className='hidden md:flex items-center gap-6 text-sm font-medium'>
          {navLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className='flex items-center gap-2 transition-all duration-200 ease-in-out hover:text-yellow-500 group'
                onClick={
                  link.href === '#pricing'
                    ? (e) => {
                        e.preventDefault();
                        document
                          .getElementById('pricing')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }
                    : undefined
                }
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
          {!isLoading && (
            <>
              {user ? (
                <>
                  <Button
                    asChild
                    className='hidden sm:inline-flex bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                  >
                    <Link href='/new-campaign'>New Campaign</Link>
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
                            src={(user.user_metadata?.avatar_url as string) || '/placeholder-user.jpg'}
                            alt={(user.user_metadata?.name as string) || (user.email as string) || 'User'}
                          />
                          <AvatarFallback>
                            <User className='h-6 w-6' />
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
                    className='hidden sm:inline-flex bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                    onClick={() => openAuth('signup')}
                  >
                    Get Started
                  </Button>
                </>
              )}
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
                      >
                        <IconComponent className='h-5 w-5' />
                        {link.label}
                      </Link>
                    );
                  })}
                  {!isLoading && !user && (
                    <>
                      <Button
                        variant='outline'
                        className='w-full bg-transparent'
                        onClick={() => openAuth('login')}
                      >
                        Sign In
                      </Button>
                      <Button
                        className='w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                        onClick={() => openAuth('signup')}
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                  {user && (
                    <Button
                      asChild
                      className='w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                    >
                      <Link href='/new-campaign'>New Campaign</Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
