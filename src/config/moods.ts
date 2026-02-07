import { MoodConfig } from '../types';

export const MOOD_CONFIGS: Record<string, MoodConfig> = {
  work: {
    label: 'Work & Study',
    icon: 'briefcase',
    color: 'bg-blue-500',
    types: ['cafe', 'library'],
    keywords: ['coffee', 'wifi', 'coworking'],
    radius: 3000,
  },
  date: {
    label: 'Date Night',
    icon: 'heart',
    color: 'bg-rose-500',
    types: ['restaurant', 'bar'],
    keywords: ['romantic', 'dinner', 'fine dining'],
    radius: 5000,
  },
  'quick-bite': {
    label: 'Quick Bite',
    icon: 'utensils',
    color: 'bg-orange-500',
    types: ['restaurant', 'cafe', 'meal_takeaway'],
    keywords: ['fast food', 'quick', 'takeout'],
    radius: 2000,
  },
  budget: {
    label: 'Budget Friendly',
    icon: 'wallet',
    color: 'bg-green-500',
    types: ['restaurant', 'cafe', 'food'],
    keywords: ['cheap', 'affordable', 'budget'],
    radius: 3000,
  },
};
