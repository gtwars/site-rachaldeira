'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
    targetDate: string;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();

            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }

            return null;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) {
        return <div className="text-2xl font-bold text-red-600">Racha já começou!</div>;
    }

    return (
        <div className="flex gap-4 justify-center">
            <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-green-700">{timeLeft.days}</div>
                <div className="text-sm text-gray-600">dias</div>
            </div>
            <div className="text-4xl font-bold text-gray-400">:</div>
            <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-green-700">{timeLeft.hours}</div>
                <div className="text-sm text-gray-600">horas</div>
            </div>
            <div className="text-4xl font-bold text-gray-400">:</div>
            <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-green-700">{timeLeft.minutes}</div>
                <div className="text-sm text-gray-600">min</div>
            </div>
            <div className="text-4xl font-bold text-gray-400">:</div>
            <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-green-700">{timeLeft.seconds}</div>
                <div className="text-sm text-gray-600">seg</div>
            </div>
        </div>
    );
}
