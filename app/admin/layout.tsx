import Link from 'next/link';
import { Users, CalendarDays, Trophy, PiggyBank, Home, LogOut, LayoutDashboard, Shuffle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const role = profile?.role || 'user';

    const allNavItems = [
        { href: '/admin', label: 'Painel', icon: LayoutDashboard },
        { href: '/admin/integrantes', label: 'Integrantes', icon: Users },
        { href: '/admin/rachas', label: 'Rachas', icon: CalendarDays },
        { href: '/admin/campeonatos', label: 'Campeonatos', icon: Trophy },
        { href: '/admin/galeria', label: 'Galeria', icon: ImageIcon },
        { href: '/admin/financeiro', label: 'Financeiro', icon: PiggyBank },
        { href: '/admin/sorteio', label: 'Sorteio', icon: Shuffle },
    ];

    // Filtrar itens baseados no cargo
    const navItems = allNavItems.filter(item => {
        if (role === 'director' && item.href === '/admin/financeiro') {
            return false;
        }
        return true;
    });

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-950 text-white flex flex-col border-r border-slate-800 flex-shrink-0 h-screen sticky top-0">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Trophy className="text-yellow-500" />
                        RachaAdmin
                    </h1>
                    <div className="mt-2 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        {role === 'admin' ? 'Administrador' : role === 'director' ? 'Diretor' : 'Usuário'}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white rounded-lg transition-colors"
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white rounded-lg transition-colors"
                    >
                        <Home size={20} />
                        <span>Voltar ao Site</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 w-full">
                {children}
            </main>
        </div>
    );
}
