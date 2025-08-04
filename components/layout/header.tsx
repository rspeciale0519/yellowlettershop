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
import { LoginModal } from '@/components/auth/login-modal';
import { useState, useEffect } from 'react';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navLinks = [
    { href: '/design/customize', label: 'New Design', icon: Palette },
    { href: '/templates', label: 'Templates', icon: FileText },
    { href: '/mailing-services/build-lists', label: 'Build a List', icon: List },
    { href: '/mailing-services/mailing-list-manager', label: 'Mailing List Manager', icon: Users },
    { href: '/#pricing', label: 'Pricing', icon: DollarSign },
  ];

  // Check for existing user session on component mount
  useEffect(() => {
    const checkUserSession = () => {
      try {
        const storedUser =
          localStorage.getItem('yls_user') ||
          sessionStorage.getItem('yls_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();
  }, []);

  // Handle successful login
  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('yls_user');
    sessionStorage.removeItem('yls_user');
    setUser(null);
    // Optionally redirect to home page
    window.location.href = '/';
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-16 items-center justify-between px-4 md:px-6 py-0 my-2.5'>
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
                            src={user.avatar || '/placeholder-user.jpg'}
                            alt={user.name || 'User'}
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
                            {user.name || 'User'}
                          </p>
                          <p className='text-xs leading-none text-muted-foreground'>
                            {user.email}
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
                  <LoginModal onLoginSuccess={handleLoginSuccess}>
                    <Button
                      variant='outline'
                      className='hidden sm:inline-flex bg-transparent'
                    >
                      Sign In
                    </Button>
                  </LoginModal>
                  <Button
                    asChild
                    className='hidden sm:inline-flex bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                  >
                    <Link href='/signup'>Get Started</Link>
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
                      <LoginModal onLoginSuccess={handleLoginSuccess}>
                        <Button
                          variant='outline'
                          className='w-full bg-transparent'
                        >
                          Sign In
                        </Button>
                      </LoginModal>
                      <Button
                        asChild
                        className='w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                      >
                        <Link href='/signup'>Get Started</Link>
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
