import { Briefcase, Heart, Utensils, Wallet } from 'lucide-react';
import { Mood } from '../types';
import { MOOD_CONFIGS } from '../config/moods';

interface MoodSelectorProps {
  selectedMood: Mood | null;
  onMoodSelect: (mood: Mood) => void;
  disabled?: boolean;
}

const iconMap = {
  briefcase: Briefcase,
  heart: Heart,
  utensils: Utensils,
  wallet: Wallet,
};

export default function MoodSelector({
  selectedMood,
  onMoodSelect,
  disabled = false,
}: MoodSelectorProps) {


  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(MOOD_CONFIGS).map(([key, config], index) => {
        const Icon = iconMap[config.icon as keyof typeof iconMap];
        const isSelected = selectedMood === key;

        return (
          <button
            key={key}
            onClick={() => onMoodSelect(key as Mood)}
            disabled={disabled}
            style={{ animationDelay: `${index * 100}ms` }}
            className={`
              relative p-6 rounded-2xl border-2 transition-all duration-300
              animate-fadeInUp
              ${isSelected
                ? `${config.color} border-transparent text-white shadow-lg scale-105`
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-xl'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${!disabled ? 'hover:-translate-y-2 hover:scale-105' : ''}
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <Icon className="w-8 h-8 transition-transform duration-300" />
              <span className="font-semibold text-sm">{config.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
