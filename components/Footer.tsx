import Link from 'next/link';
import NextImage from 'next/image';
import { Instagram, MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
                    {/* Logo e Descrição */}
                    <div className="col-span-1 flex flex-col items-center md:items-start gap-4">
                        <NextImage
                            src="https://pqroxmeyuicutatbessb.supabase.co/storage/v1/object/public/Fotos/logo%20rachaldeira.png"
                            alt="Rachaldeira Logo"
                            width={150}
                            height={150}
                            className="object-contain"
                            sizes="150px"
                        />
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Rachaldeira</h3>
                            <p className="text-sm text-gray-400">
                                Resenha, futebol e dindo.
                            </p>
                        </div>
                    </div>

                    {/* Páginas */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Páginas</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="hover:text-white transition-colors">
                                    Início
                                </Link>
                            </li>
                            <li>
                                <Link href="/rachas" className="hover:text-white transition-colors">
                                    Rachas
                                </Link>
                            </li>
                            <li>
                                <Link href="/campeonatos" className="hover:text-white transition-colors">
                                    Campeonatos
                                </Link>
                            </li>
                            <li>
                                <Link href="/rank" className="hover:text-white transition-colors">
                                    Ranking
                                </Link>
                            </li>
                            <li>
                                <Link href="/galeria" className="hover:text-white transition-colors">
                                    Galeria
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Redes Sociais */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Redes Sociais</h4>
                        <a
                            href="https://instagram.com/rachaldeira"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center md:justify-start gap-2 text-sm hover:text-white transition-colors"
                        >
                            <Instagram size={18} />
                            @rachaldeira
                        </a>
                    </div>

                    {/* Endereço */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Endereço</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start justify-center md:justify-start gap-2">
                                <MapPin size={18} className="flex-shrink-0 mt-0.5" />
                                <span>R. Sylvio Lagreca, 08 - Parque Ipe,<br />São Paulo - SP, 05571-010</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
                    <p>
                        &copy; {new Date().getFullYear()} Rachaldeira. Todos os direitos reservados. |{' '}
                        <a
                            href="https://www.instagram.com/oguigestor/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors"
                        >
                            Desenvolvido por Guilherme Rodrigues
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
