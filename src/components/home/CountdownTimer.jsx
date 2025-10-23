import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getCurrentPacificTime, dateStringToPacificEndOfDay } from '@/components/lib/timezone';

export default function CountdownTimer({ endDate, title = "TIME REMAINING:" }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date(); // Use local time for calculation start
      const targetDate = dateStringToPacificEndOfDay(endDate);
      
      // Calculate difference in milliseconds, accounting for client's own timezone offset.
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        expired: false
      });
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (!endDate || timeLeft.expired) {
    return null;
  }

  const TimeBlock = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-black rounded-lg p-2 md:p-3 shadow-xl min-w-[50px] md:min-w-[70px] border border-white/10">
        <div className="text-2xl md:text-4xl font-bold text-white tabular-nums">
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <div className="text-white/90 text-xs md:text-sm font-medium mt-1 capitalize">
        {label}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-white/90" />
          <h3 className="text-white/90 text-sm md:text-base font-semibold tracking-wide uppercase">
            {title}
          </h3>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 md:gap-4">
        <TimeBlock value={timeLeft.days} label="Days" />
        <div className="text-white text-xl md:text-3xl font-bold mb-6">:</div>
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <div className="text-white text-xl md:text-3xl font-bold mb-6">:</div>
        <TimeBlock value={timeLeft.minutes} label="Minutes" />
        <div className="text-white text-xl md:text-3xl font-bold mb-6">:</div>
        <TimeBlock value={timeLeft.seconds} label="Seconds" />
      </div>
    </div>
  );
}