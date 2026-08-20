'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const PERIODS = [
    { label: '1 mês', value: '1' },
    { label: '2 meses', value: '2' },
    { label: '3 meses', value: '3' },
    { label: '6 meses', value: '6' },
    { label: '1 ano', value: '12' },
];

export function PresencaFilters({ current }: { current: string }) {
    const router = useRouter();

    return (
        <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
                <button
                    key={p.value}
                    onClick={() => router.push(`/admin/presenca?periodo=${p.value}`)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        current === p.value
                            ? 'bg-[#093a9f] text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-[#093a9f] hover:text-[#093a9f]'
                    }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}
