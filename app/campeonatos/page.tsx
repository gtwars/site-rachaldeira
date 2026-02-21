import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, History, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function CampeonatosPage() {
    const supabase = await createClient();

    // Buscar campeonatos
    const { data: championships } = await supabase
        .from('championships')
        .select('*')
        .order('start_date', { ascending: false });

    const activeChampionships = championships?.filter(c => c.status !== 'completed') || [];
    const pastChampionships = championships?.filter(c => c.status === 'completed') || [];

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white text-gray-900 pt-8 pb-8 px-4 border-b border-gray-200">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">
                        Campeonatos Rachaldeira
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        O palco onde as lendas são forjadas e as amizades... bem, continuam as mesmas.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">

                {/* Campeonatos Ativos */}
                <section>
                    <div className="flex items-center gap-3 mb-8 border-b border-gray-200 pb-4">
                        <div className="bg-yellow-100 p-2 rounded-lg">
                            <Trophy className="text-yellow-700" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Próximo Campeonato
                        </h2>
                    </div>

                    {activeChampionships.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {activeChampionships.map((camp) => (
                                <Link key={camp.id} href={`/campeonatos/${camp.id}`} className="group h-full block">
                                    <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-yellow-500 overflow-hidden">
                                        <CardContent className="p-6 flex flex-col h-full">
                                            <div className="flex gap-4 items-center mb-4">
                                                {camp.logo_url && (
                                                    <div className="relative w-12 h-12 flex-shrink-0">
                                                        <img src={camp.logo_url} className="w-full h-full object-contain" alt="" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-wide ${camp.status === 'in_progress' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {camp.status === 'in_progress' ? 'Em Andamento' : 'Em Breve'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-black text-gray-900 group-hover:text-black transition-colors">
                                                        {camp.name}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-sm text-gray-600 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-gray-900" />
                                                    <span>Início: <strong>{new Date(camp.start_date).toLocaleDateString('pt-BR')}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-gray-900" />
                                                    <span>{camp.location}</span>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-gray-100">
                                                <Button className="w-full bg-gray-900 hover:bg-black group-hover:shadow-md transition-all">
                                                    Ver Detalhes <ArrowRight size={16} className="ml-2" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-lg">Nenhum campeonato ativo no momento.</p>
                        </div>
                    )}
                </section>

                {/* Histórico */}
                {(pastChampionships.length > 0 || activeChampionships.length === 0) && (
                    <section>
                        <div className="flex items-center gap-3 mb-8 border-b border-gray-200 pb-4">
                            <div className="bg-gray-100 p-2 rounded-lg">
                                <History className="text-gray-700" size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                Galeria de Campeões (Histórico)
                            </h2>
                        </div>

                        {pastChampionships.length > 0 ? (
                            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {pastChampionships.map((camp) => (
                                    <Link key={camp.id} href={`/campeonatos/${camp.id}`} className="group h-full block">
                                        <Card className="h-full hover:shadow-md transition-all hover:bg-gray-50 border-gray-200">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    {camp.logo_url ? (
                                                        <div className="relative w-8 h-8">
                                                            <img src={camp.logo_url} className="w-full h-full object-contain" alt="" />
                                                        </div>
                                                    ) : (
                                                        <Trophy size={20} className="text-gray-400 group-hover:text-yellow-500 transition-colors" />
                                                    )}
                                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {new Date(camp.start_date).getFullYear()}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-700 group-hover:text-gray-900 mb-2">
                                                    {camp.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                                    {camp.location}
                                                </p>
                                                <div className="text-blue-600 text-sm font-medium flex items-center group-hover:underline">
                                                    Ver resultados
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 italic">
                                A história ainda está sendo escrita...
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}
