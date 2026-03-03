// Forced rebuild to investigate 404
import Link from 'next/link';
import NextImage from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Trophy, Instagram, Star } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default async function Home() {
    let members: any[] = [];
    let lastRacha: any = null;
    let rachas: any[] = [];
    let campeonatos: any[] = [];
    let weeklyHighlights: any = null;

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseAnonKey) {
            const supabase = await createClient();

            // Buscar membros para exibir nomes nos destaques
            const { data: membersData } = await supabase
                .from('members')
                .select('id, name, position, photo_url');
            members = membersData || [];

            // Buscar último racha fechado para destaques semanais
            const { data: lastRachaData } = await supabase
                .from('rachas')
                .select('*')
                .eq('status', 'closed')
                .neq('location', 'Sistema (Manual)')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            lastRacha = lastRachaData;

            if (lastRacha && members.length > 0) {
                const top1 = members.find(m => m.id === lastRacha.top1_id);
                const top1_extra = members.find(m => m.id === lastRacha.top1_extra_id);
                const top1_extra2 = members.find(m => m.id === lastRacha.top1_extra2_id);
                const top2 = members.find(m => m.id === lastRacha.top2_id);
                const top2_extra = members.find(m => m.id === lastRacha.top2_extra_id);
                const top2_extra2 = members.find(m => m.id === lastRacha.top2_extra2_id);
                const top3 = members.find(m => m.id === lastRacha.top3_id);
                const top3_extra = members.find(m => m.id === lastRacha.top3_extra_id);
                const top3_extra2 = members.find(m => m.id === lastRacha.top3_extra2_id);
                const sheriff = members.find(m => m.id === lastRacha.sheriff_id);
                const sheriff_extra = members.find(m => m.id === lastRacha.sheriff_extra_id);
                const sheriff_extra2 = members.find(m => m.id === lastRacha.sheriff_extra2_id);

                weeklyHighlights = {
                    rachaLabel: new Date(lastRacha.date_time).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                    top1,
                    top1_extra,
                    top1_extra2,
                    top2,
                    top2_extra,
                    top2_extra2,
                    top3,
                    top3_extra,
                    top3_extra2,
                    sheriff,
                    sheriff_extra,
                    sheriff_extra2
                };
            }

            // Buscar próximos rachas (abertos ou travados)
            const { data: rachasData } = await supabase
                .from('rachas')
                .select('*')
                .in('status', ['open', 'locked'])
                .neq('location', 'Sistema (Manual)')
                .order('date_time', { ascending: true })
                .limit(4);
            rachas = rachasData || [];

            // Buscar campeonatos ativos
            const { data: champData } = await supabase
                .from('championships')
                .select('*')
                .eq('status', 'in_progress')
                .order('start_date', { ascending: false });
            campeonatos = champData || [];
        }
    } catch (error) {
        console.error("Error fetching homepage data:", error);
    }

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            {/* Hero Section */}
            <div className="relative min-h-[70vh] flex flex-col items-center justify-center text-center text-white p-4 overflow-hidden">
                <NextImage
                    src="/hero-bg.png"
                    alt="Rachaldeira Hero Background"
                    fill
                    className="object-cover z-0 object-top md:object-[center_25%]"
                    priority
                    sizes="100vw"
                />

                {/* Overlay Escuro */}
                <div className="absolute inset-0 bg-black/50 z-0"></div>

                {/* Conteúdo Hero */}
                <div className="relative z-10 animate-fade-in-up flex flex-col items-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md">
                        Bem-vindo ao Rachaldeira
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-100 max-w-2xl mx-auto drop-shadow-sm font-light">
                        Resenha, amizade e futebol levado a sério.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12 w-full space-y-12">

                {/* Destaques da Semana (Último Racha) */}
                {weeklyHighlights && (
                    <Card className="mb-0 border-none bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        <CardHeader className="relative z-10 border-b border-blue-700/50 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-3 text-2xl text-white">
                                    <Star className="text-yellow-400 fill-yellow-400" />
                                    Destaques do Último Racha
                                </CardTitle>
                                <span className="bg-blue-950/50 px-3 py-1 rounded-full text-sm font-medium border border-blue-700/50">
                                    {weeklyHighlights.rachaLabel}
                                </span>
                            </div>
                            <p className="text-blue-200 text-sm">Os melhores da última partida realizada</p>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-4 pb-6 px-0 md:px-6">
                            {/* Mobile View */}
                            <div className="grid grid-cols-2 gap-3 md:hidden px-4">
                                <div className="bg-white/10 rounded-lg p-3 text-center border border-white/10 flex flex-col justify-center min-h-[120px]">
                                    <div className="text-2xl mb-1">👑</div>
                                    <div className="font-bold text-yellow-300 text-[10px] uppercase mb-1">Craque</div>
                                    <div className="font-bold text-white text-base leading-tight">{weeklyHighlights.top1?.name || '-'}</div>
                                    {weeklyHighlights.top1_extra && <div className="mt-2 pt-2 border-t border-white/10 font-bold text-white text-base leading-tight">{weeklyHighlights.top1_extra.name}</div>}
                                    {weeklyHighlights.top1_extra2 && <div className="mt-2 pt-2 border-t border-white/10 font-bold text-white text-base leading-tight">{weeklyHighlights.top1_extra2.name}</div>}
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 flex flex-col justify-center min-h-[120px]">
                                    <div className="text-2xl mb-1">🥈</div>
                                    <div className="font-bold text-gray-300 text-[10px] uppercase mb-1">Top 2</div>
                                    <div className="font-bold text-white text-base leading-tight">{weeklyHighlights.top2?.name || '-'}</div>
                                    {weeklyHighlights.top2_extra && <div className="mt-2 pt-2 border-t border-white/10 font-bold text-white text-base leading-tight">{weeklyHighlights.top2_extra.name}</div>}
                                    {weeklyHighlights.top2_extra2 && <div className="mt-2 pt-2 border-t border-white/10 font-bold text-white text-base leading-tight">{weeklyHighlights.top2_extra2.name}</div>}
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 flex flex-col justify-center min-h-[120px]">
                                    <div className="text-2xl mb-1">🥉</div>
                                    <div className="font-bold text-orange-300 text-[10px] uppercase mb-1">Top 3</div>
                                    <div className="font-bold text-white text-base leading-tight">{weeklyHighlights.top3?.name || '-'}</div>
                                    {weeklyHighlights.top3_extra && <div className="mt-2 pt-2 border-t border-white/10 font-bold text-white text-base leading-tight">{weeklyHighlights.top3_extra.name}</div>}
                                    {weeklyHighlights.top3_extra2 && <div className="mt-2 pt-2 border-t border-white/10 font-bold text-white text-base leading-tight">{weeklyHighlights.top3_extra2.name}</div>}
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 flex flex-col justify-center min-h-[120px]">
                                    <div className="text-2xl mb-1">👮</div>
                                    <div className="font-bold text-blue-300 text-[10px] uppercase mb-1">Xerife</div>
                                    <div className="font-bold text-white text-base leading-tight">{weeklyHighlights.sheriff?.name || '-'}</div>
                                    {weeklyHighlights.sheriff_extra && <div className="mt-2 pt-2 border-t border-white/10 font-bold text-white text-base leading-tight">{weeklyHighlights.sheriff_extra.name}</div>}
                                    {weeklyHighlights.sheriff_extra2 && <div className="mt-2 pt-2 border-t border-white/10 font-bold text-white text-base leading-tight">{weeklyHighlights.sheriff_extra2.name}</div>}
                                </div>
                            </div>
                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto rounded-lg border border-white/10 mx-6">
                                <Table>
                                    <TableHeader className="bg-blue-950/50">
                                        <TableRow className="hover:bg-transparent border-white/10">
                                            <TableHead className="text-center font-bold text-white h-12 text-lg w-1/4">👑 Craque</TableHead>
                                            <TableHead className="text-center font-bold text-white h-12 text-lg w-1/4">🥈 Top 2</TableHead>
                                            <TableHead className="text-center font-bold text-orange-300 h-12 text-lg w-1/4">🥉 Top 3</TableHead>
                                            <TableHead className="text-center font-bold text-white h-12 text-lg w-1/4">👮 Xerife</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="hover:bg-white/5 border-none">
                                            <TableCell className="text-center py-6">
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="text-2xl font-black text-white">{weeklyHighlights.top1?.name || '-'}</span>
                                                    {weeklyHighlights.top1_extra && <span className="text-2xl font-black text-white pt-2 border-t border-white/10 w-full">{weeklyHighlights.top1_extra.name}</span>}
                                                    {weeklyHighlights.top1_extra2 && <span className="text-2xl font-black text-white pt-2 border-t border-white/10 w-full">{weeklyHighlights.top1_extra2.name}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-6">
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="text-xl font-bold text-gray-100">{weeklyHighlights.top2?.name || '-'}</span>
                                                    {weeklyHighlights.top2_extra && <span className="text-xl font-bold text-gray-100 pt-2 border-t border-white/10 w-full">{weeklyHighlights.top2_extra.name}</span>}
                                                    {weeklyHighlights.top2_extra2 && <span className="text-xl font-bold text-gray-100 pt-2 border-t border-white/10 w-full">{weeklyHighlights.top2_extra2.name}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-6">
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="text-xl font-bold text-orange-50">{weeklyHighlights.top3?.name || '-'}</span>
                                                    {weeklyHighlights.top3_extra && <span className="text-xl font-bold text-orange-50 pt-2 border-t border-white/10 w-full">{weeklyHighlights.top3_extra.name}</span>}
                                                    {weeklyHighlights.top3_extra2 && <span className="text-xl font-bold text-orange-50 pt-2 border-t border-white/10 w-full">{weeklyHighlights.top3_extra2.name}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-6">
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="text-xl font-bold text-blue-50">{weeklyHighlights.sheriff?.name || '-'}</span>
                                                    {weeklyHighlights.sheriff_extra && <span className="text-xl font-bold text-blue-50 pt-2 border-t border-white/10 w-full">{weeklyHighlights.sheriff_extra.name}</span>}
                                                    {weeklyHighlights.sheriff_extra2 && <span className="text-xl font-bold text-blue-50 pt-2 border-t border-white/10 w-full">{weeklyHighlights.sheriff_extra2.name}</span>}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="mt-8 flex justify-center w-full px-6">
                                <Link href="/rank" className="w-full max-w-4xl">
                                    <Button className="w-full !bg-[#af1c15] hover:!bg-[#8f1610] text-white font-bold h-12 text-lg shadow-b-4 border-b-4 border-[#8f1610] active:border-0 active:translate-y-1 transition-all">
                                        Ver Ranking Completo 🏆
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Próximos Rachas */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <CalendarDays className="text-[#093a9f]" />
                            Próximos Rachas
                        </h2>
                    </div>
                    {rachas && rachas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {rachas.map((racha) => (
                                <Link
                                    key={racha.id}
                                    href={racha.is_next ? '/rachas/proximo' : `/rachas/${racha.id}`}
                                    className="block group"
                                >
                                    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-[#093a9f]">
                                        <CardContent className="p-4">
                                            <div className="flex flex-col h-full justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-900 group-hover:text-[#093a9f] transition-colors truncate">
                                                        {racha.is_next && '🔥 '}{racha.location}
                                                    </p>
                                                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                        <CalendarDays size={14} />
                                                        {new Date(racha.date_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                                    </p>
                                                </div>
                                                <div className="mt-3">
                                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wide ${racha.status === 'open' ? 'bg-green-100 text-green-700' :
                                                        racha.status === 'locked' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {racha.status === 'open' ? 'Aberto' :
                                                            racha.status === 'locked' ? 'Travado' :
                                                                racha.status === 'in_progress' ? 'Em Jogo' : 'Fechado'}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-500">
                            Nenhum racha agendado no momento.
                        </div>
                    )}
                    <Link href="/rachas" className="block mt-4">
                        <Button variant="outline" className="w-full border-dashed group">
                            Ver Agenda Completa
                            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </Button>
                    </Link>
                </section>

                {/* História do Grupo */}
                <section>
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 relative inline-block pb-2 border-b-4 border-[#af1c15]">
                            Nossa História
                        </h2>
                    </div>
                    <Card className="border-none shadow-md bg-white/80 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="grid md:grid-cols-5 gap-0">
                                <div className="md:col-span-2 relative min-h-[300px] md:min-h-[500px]">
                                    <NextImage
                                        src="https://pqroxmeyuicutatbessb.supabase.co/storage/v1/object/public/Fotos/Foto%20cal%20presida.jpg"
                                        alt="Cal Presida - Rachaldeira"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 40vw"
                                    />
                                </div>
                                <div className="md:col-span-3 p-8 md:p-10 flex flex-col justify-center">
                                    <div className="text-gray-600 leading-relaxed space-y-4 text-base">
                                        <p>
                                            No início de 2019, surgiu no coração do Suricato a ideia de organizar um racha no Sport Gaúcho. Mas não era qualquer racha — a proposta era algo diferente: planilha na mão, scouts sendo anotados e, claro, aquela vontade de fazer tudo bem feito. Sabendo das dificuldades para reunir jogadores e manter o controle financeiro, Suricato convidou Cal para ajudar na organização.
                                        </p>
                                        <p>
                                            Tudo corria bem, até que em março de 2020 a pandemia chegou e atrapalhou os planos. O racha foi interrompido. Mas a paixão pelo futebol falou mais alto: em janeiro de 2021, Muca resolveu assumir a responsabilidade de reerguer o projeto ao lado de Cal. Trouxe com ele não só a sua galera, mas também inovação com o app Chega Mais, que além de controlar a presença, registrava os scouts e destacava os melhores jogadores da semana.
                                        </p>
                                        <p>
                                            A turma foi crescendo e o racha ganhando força. No fim de 2021, Muca se despediu do projeto, deixando o comando nas mãos de Caldeira, que seguiu firme.
                                        </p>
                                        <blockquote className="border-l-4 border-[#093a9f] pl-5 py-3 my-2 text-[#093a9f]/80 bg-blue-50/50 rounded-r-lg">
                                            "Queremos um racha organizado, sem brigas, com muita resenha, competição saudável e, acima de tudo, amizade."
                                        </blockquote>
                                        <p>
                                            Desde então, Caldeira reuniu um group de pessoas com a mesma mentalidade, que hoje compõem a diretoria do time: Buiu, Diogo, PH, Matheus, Texas, Zirão e Guizao. Juntos, seguimos evoluindo dia após dia, sempre buscando excelência em tudo que fazemos.
                                        </p>
                                        <p>
                                            Não é à toa que já participamos de cinco campeonatos — todos com muita festa, resenha e diversão (menos pro presidente, que segue firme... mas ainda virgem de títulos).
                                        </p>
                                        <p className="text-gray-700 mt-2">
                                            Seja muito bem-vindo ao site do nosso racha. Aqui o futebol é levado a sério, mas a amizade é o que realmente importa.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Campeonatos */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Trophy className="text-[#af1c15]" />
                            Campeonatos
                        </h2>
                        {campeonatos && campeonatos.length > 0 ? (
                            <div className="space-y-4">
                                {campeonatos.map((camp) => (
                                    <Link key={camp.id} href={`/campeonatos/${camp.id}`} className="block group">
                                        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-[#af1c15]">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-[#af1c15] transition-colors">{camp.name}</p>
                                                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                                                            {camp.format === 'round_robin' ? 'Pontos Corridos' : 'Mata-mata'}
                                                        </p>
                                                    </div>
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                                                        {new Date(camp.start_date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                                <Link href="/campeonatos">
                                    <Button variant="outline" className="w-full border-dashed group">
                                        Ver Classificação
                                        <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-500">Nenhum campeonato ativo.</div>
                        )}
                    </section>

                    {/* Instagram */}
                    <section className="flex flex-col">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Instagram className="text-pink-500" />
                            Rede Social
                        </h2>
                        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none shadow-lg h-full">
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                                <Instagram size={32} className="mb-3" />
                                <h3 className="font-bold text-lg mb-1">Siga o Rachaldeira</h3>
                                <p className="text-sm opacity-90 mb-4">Fotos, vídeos e os melhores momentos!</p>
                                <a href="https://instagram.com/rachaldeira" target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button variant="outline" className="w-full bg-white text-gray-900 hover:bg-gray-50 border-2 border-white font-semibold">
                                        @rachaldeira
                                    </Button>
                                </a>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
        </main>
    );
}
