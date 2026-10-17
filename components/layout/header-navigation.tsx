"use client"

import Link from 'next/link'
import type { MouseEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Menu, List, Users, FileText, DollarSign, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export interface HeaderNavLink {
  href: string
  label: string
  icon: LucideIcon
  requiresAuth: boolean
}
interface NavigationProps {
  navLinks: HeaderNavLink[]
  handleNavClick: (event: MouseEvent, link: HeaderNavLink) => void
}
export function DesktopNavigation({ navLinks, handleNavClick }: NavigationProps) {
  return (
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
  )
}

interface MobileNavigationProps extends NavigationProps {
  showAuth: boolean
  openAuth: (mode: 'login' | 'signup') => void
  handleNewCampaign: () => void
  onPricing: () => void
}
export function MobileNavigation({ navLinks, handleNavClick, showAuth, openAuth, handleNewCampaign, onPricing }: MobileNavigationProps) {
  return (
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
                            onPricing();
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
                  {showAuth && (
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
  )
}

export const headerNavLinks: HeaderNavLink[] = [
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
