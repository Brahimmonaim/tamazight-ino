export interface LetterItem {
  l: string;
  label: string;
  word: string;
  emoji: string;
  img: string;
  sound: string;
}

export interface DayItem {
  tif: string;
  lat: string;
  icon: string;
  color: string;
  sound: string;
}

export interface NumberItem {
  num: number;
  tif: string;
  emoji: string;
  img: string;
  sound: string;
}

export interface ColorItem {
  tif: string;
  lat: string;
  bg: string;
  text: string;
  sound: string;
}

export interface SeasonItem {
  tif: string;
  lat: string;
  bg: string;
  emoji: string;
  months: string;
  img: string;
  sound: string;
}

export interface MonthItem {
  num: number;
  tif: string;
  emoji: string;
  bg: string;
  sound: string;
}

export interface OrganItem {
  tif: string;
  lat: string;
  emoji: string;
  img: string;
  sound: string;
}

export interface FruitItem {
  tif: string;
  lat: string;
  emoji: string;
  img: string;
  sound: string;
}

export type ActiveSection = 'home' | 'letters' | 'days' | 'numbers' | 'colors' | 'seasonsmonths' | 'organs' | 'fruits' | 'playground';
