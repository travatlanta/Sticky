'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ShoppingCart, User, Menu, X, Bell, Package, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationData {
  notifications: Notification[];
  unreadCount: number;
}

interface CartItem {
  id: number;
  quantity: number;
}

interface CartData {
  items: CartItem[];
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const user = session?.user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: cartData } = useQuery<CartData>({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: notificationData } = useQuery<NotificationData>({
    queryKey: ['/api/notifications'],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const cartItemCount = cartData?.items?.length || 0;
  const unreadNotifications = notificationData?.unreadCount || 0;
  const notifications = notificationData?.notifications || [];

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm fixed top-0 left-0 right-0 z-50 border-b border-orange-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            className="md:hidden p-2 text-gray-600 hover:text-orange-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu-left"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <Link href="/" className="flex items-center space-x-2 group absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <Image
              src="/logo-icon.png"
              alt="Sticky Banditos"
              width={44}
              height={44}
              className="rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
            />
            <span className="font-display font-bold text-lg md:text-xl text-gray-900">Sticky Banditos</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
              Products
            </Link>
            <Link href="/deals" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
              Deals
            </Link>
            {isAuthenticated && (
              <Link href="/orders" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
                My Orders
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && (
              <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-orange-500 hover:bg-orange-50" data-testid="button-notifications">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" data-testid="notification-count">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadNotifications > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                        data-testid="button-mark-all-read"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <Link
                          key={notification.id}
                          href={notification.link || '/account'}
                          onClick={() => setNotificationsOpen(false)}
                          className={`block p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                            !notification.isRead ? 'bg-orange-50/50' : ''
                          }`}
                          data-testid={`notification-item-${notification.id}`}
                        >
                          <div className="flex gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              notification.type === 'order' ? 'bg-blue-100 text-blue-600' :
                              notification.type === 'artwork' ? 'bg-green-100 text-green-600' :
                              'bg-orange-100 text-orange-600'
                            }`}>
                              {notification.type === 'order' ? <Package className="h-4 w-4" /> :
                               notification.type === 'artwork' ? <CheckCircle className="h-4 w-4" /> :
                               <Bell className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2" />
                            )}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  {notifications.length > 5 && (
                    <div className="p-2 border-t">
                      <Link
                        href="/account"
                        onClick={() => setNotificationsOpen(false)}
                        className="block text-center text-sm text-orange-500 hover:text-orange-600 font-medium py-2"
                        data-testid="link-view-all-notifications"
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50" data-testid="button-cart">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" data-testid="cart-count">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link href="/account">
                  {(user as any)?.image ? (
                    <img
                      src={(user as any).image}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-200 cursor-pointer hover:ring-orange-400 transition-all"
                      data-testid="link-account-avatar"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center ring-2 ring-orange-200 cursor-pointer hover:ring-orange-400 transition-all" data-testid="link-account-avatar">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                  )}
                </Link>
                {(user as any)?.isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="border-orange-200 hover:bg-orange-50">
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  data-testid="button-sign-out"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/30" data-testid="button-sign-in">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <div className="md:hidden w-10"></div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-orange-100 bg-white/95">
            <div className="flex flex-col space-y-4">
              <Link
                href="/products"
                className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/deals"
                className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Deals
              </Link>
              {isAuthenticated && (
                <Link
                  href="/orders"
                  className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
              )}
              <Link
                href="/cart"
                className="text-gray-600 hover:text-orange-500 font-medium transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart
                {cartItemCount > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  {(user as any)?.isAdmin && (
                    <Link
                      href="/admin"
                      className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-gray-600 hover:text-orange-500 font-medium transition-colors text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" className="text-orange-500 font-bold transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
