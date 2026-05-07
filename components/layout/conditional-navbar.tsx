'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

interface Props {
    user: any;
    profile: any;
    member: any;
}

export function ConditionalNavbar({ user, profile, member }: Props) {
    const pathname = usePathname();
    const isAuthRoute = AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(route));
    if (isAuthRoute) return null;
    return <Navbar user={user} profile={profile} member={member} />;
}
