import { MORE } from './places';

// Downtown Seattle coffee spots. Hours come from Google Maps listings (pulled Oct 5, 2026).
// Days run Monday..Sunday. Open/closed is worked out live in Seattle time.
export type Kind = 'coffee' | 'dinner' | 'bakery' | 'dentist' | 'pt' | 'hair' | 'nails' | 'massage' | 'tailor' | 'shoes' | 'flowers';

export interface Shop {
  kind?: Kind;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  maps: string;
  hours: string[]; // 7 entries, Monday first: "7:00 AM - 6:00 PM" or "Closed"
}

const d = (s: string) => Array(7).fill(s);
const m = 'https://maps.google.com/?cid=';

const COFFEE: Shop[] = [
  { name: 'Olympia Coffee Roasting', address: '1420 5th Ave', lat: 47.610384, lng: -122.3352306, rating: 4.4, reviews: 458, maps: m + '14205993247671157088', hours: [...d('6:00 AM - 6:00 PM').slice(0, 5), '7:00 AM - 6:00 PM', '7:00 AM - 6:00 PM'] },
  { name: 'Storyville Coffee Pike Place', address: '94 Pike St, top floor', lat: 47.60895, lng: -122.3404309, rating: 4.6, reviews: 3221, maps: m + '8582500234709843288', hours: [...d('6:59 AM - 5:00 PM').slice(0, 4), ...d('6:59 AM - 6:00 PM').slice(0, 3)] },
  { name: 'Anchorhead Coffee', address: '1600 7th Ave', lat: 47.6134003, lng: -122.3347638, rating: 4.6, reviews: 1965, maps: m + '1654276046964532589', hours: d('7:00 AM - 6:00 PM') },
  { name: 'Slow Day Coffee', address: '2103 3rd Ave', lat: 47.6131742, lng: -122.3426386, rating: 4.8, reviews: 182, maps: m + '6770972765507182984', hours: d('7:00 AM - 2:00 PM') },
  { name: 'Moore Coffee Shop', address: '1930 2nd Ave', lat: 47.6116389, lng: -122.3412222, rating: 4.6, reviews: 1090, maps: m + '17455646178347923315', hours: ['Closed', 'Closed', 'Closed', '8:00 AM - 3:30 PM', '8:00 AM - 3:30 PM', '8:00 AM - 3:30 PM', '8:00 AM - 3:00 PM'] },
  { name: 'CU Urban Market & Cafe', address: '1117 1st Ave', lat: 47.6057955, lng: -122.3375124, rating: 4.7, reviews: 218, maps: m + '12699986637125275300', hours: [...d('6:30 AM - 7:00 PM').slice(0, 6), '8:00 AM - 4:00 PM'] },
  { name: 'Coffee Astronaut', address: '400 Pine St', lat: 47.6114644, lng: -122.3372342, rating: 4.9, reviews: 64, maps: m + '13461511537632676009', hours: d('8:00 AM - 7:00 PM') },
  { name: 'Coffee TAB', address: '211 Lenora St', lat: 47.6125094, lng: -122.342781, rating: 4.7, reviews: 633, maps: m + '2974918998768439842', hours: d('7:00 AM - 3:00 PM') },
  { name: "Howdy Y'all Coffee (Central Library)", address: '1000 4th Ave, floor 3', lat: 47.6066875, lng: -122.3325625, rating: 4.9, reviews: 128, maps: m + '14713744990997548728', hours: [...d('10:00 AM - 4:00 PM').slice(0, 6), 'Closed'] },
  { name: 'Pike Street Coffee', address: '1501 Western Ave', lat: 47.6083904, lng: -122.3415875, rating: 4.2, reviews: 256, maps: m + '5900512321125285440', hours: ['7:30 AM - 5:30 PM', '7:30 AM - 5:30 PM', '7:00 AM - 5:30 PM', '7:00 AM - 6:00 PM', '7:00 AM - 6:30 PM', '7:00 AM - 6:30 PM', '7:30 AM - 6:00 PM'] },
  { name: 'The Shop by Porter', address: '1201 2nd Ave', lat: 47.6065056, lng: -122.3376377, rating: 4.5, reviews: 146, maps: m + '4731299484531744108', hours: [...d('7:00 AM - 7:00 PM').slice(0, 5), '8:00 AM - 4:00 PM', 'Closed'] },
  { name: 'Ghost Note Coffee', address: '1218 3rd Ave', lat: 47.607676, lng: -122.3356689, rating: 4.4, reviews: 38, maps: m + '4397287273808016817', hours: [...d('7:30 AM - 2:00 PM').slice(0, 5), '8:30 AM - 2:00 PM', 'Closed'] },
  { name: 'Social Grounds Coffee & Tea', address: '1914 1st Ave', lat: 47.6107343, lng: -122.3417849, rating: 4.1, reviews: 88, maps: m + '8266704877516701789', hours: [...d('7:00 AM - 6:00 PM').slice(0, 6), '7:00 AM - 5:00 PM'] },
  { name: 'Fonté Coffee', address: '1321 1st Ave', lat: 47.6072763, lng: -122.3389292, rating: 4.4, reviews: 1348, maps: m + '16182288044028783084', hours: [...d('6:00 AM - 5:00 PM').slice(0, 3), ...d('6:00 AM - 6:00 PM').slice(0, 4)] },
  { name: 'Victrola Coffee Roasters', address: '108 Pine St', lat: 47.6101668, lng: -122.3406123, rating: 4.4, reviews: 1419, maps: m + '8108040415553268087', hours: d('7:00 AM - 5:00 PM') },
  { name: 'Cherry Street Coffee House', address: '700 1st Ave', lat: 47.6027528, lng: -122.3342127, rating: 4.4, reviews: 1199, maps: m + '16696228838114007212', hours: [...d('6:30 AM - 4:00 PM').slice(0, 5), '7:30 AM - 4:00 PM', '7:30 AM - 4:00 PM'] },
  { name: 'Black Arrows Coffee', address: '521 Wall St', lat: 47.6170699, lng: -122.3444419, rating: 4.6, reviews: 305, maps: m + '3698459923270656563', hours: d('7:00 AM - 6:00 PM') },
  { name: 'Pacific Provisions Cafe', address: '1100 4th Ave', lat: 47.6070433, lng: -122.3334763, rating: 4.6, reviews: 145, maps: m + '18075891538847536186', hours: d('7:00 AM - 2:00 PM') },
  { name: 'Goldvine Coffee Bar & Gallery', address: '2125 Western Ave', lat: 47.6116599, lng: -122.3458545, rating: 4.6, reviews: 152, maps: m + '6984913936766690433', hours: ['8:00 AM - 4:00 PM', '8:00 AM - 4:00 PM', ...d('8:00 AM - 9:00 PM').slice(0, 5)] },
  { name: 'gloom coffee', address: '240 2nd Ave Ext S', lat: 47.600136, lng: -122.331072, rating: 4.9, reviews: 89, maps: m + '7316242648597029464', hours: [...d('8:00 AM - 3:00 PM').slice(0, 5), 'Closed', 'Closed'] },
  { name: 'Day Made Kaffe Bar', address: '524 1st Ave S', lat: 47.5976302, lng: -122.3337929, rating: 4.8, reviews: 157, maps: m + '7108914911659230346', hours: [...d('7:00 AM - 4:30 PM').slice(0, 5), '8:00 AM - 5:30 PM', 'Closed'] },
  { name: 'The Good Coffee Company', address: '818 Post Ave', lat: 47.6035257, lng: -122.3357275, rating: 4.9, reviews: 127, maps: m + '9282690261995262267', hours: [...d('7:00 AM - 5:00 PM').slice(0, 5), '8:00 AM - 4:00 PM', '8:00 AM - 4:00 PM'] },
  { name: 'Boon Boona Coffee', address: '1515 Western Ave', lat: 47.6085488, lng: -122.3417511, rating: 4.3, reviews: 115, maps: m + '9680991786961699850', hours: d('8:00 AM - 8:00 PM') },
  { name: 'Zeitgeist Coffee', address: '171 S Jackson St', lat: 47.5991106, lng: -122.331799, rating: 4.5, reviews: 1645, maps: m + '13717579098916042624', hours: [...d('6:00 AM - 6:00 PM').slice(0, 6), '8:00 AM - 2:00 PM'] },
  { name: 'Pegasus Coffee Bar', address: '711 3rd Ave', lat: 47.6037158, lng: -122.3325317, rating: 4.7, reviews: 273, maps: m + '18223038923931365791', hours: [...d('6:30 AM - 2:00 PM').slice(0, 5), 'Closed', 'Closed'] },
  { name: 'Lune Cafe', address: '107 1st Ave S', lat: 47.6013795, lng: -122.3345335, rating: 4.5, reviews: 1346, maps: m + '1569769584399827139', hours: ['9:00 AM - 10:00 PM', '9:00 AM - 10:00 PM', '9:00 AM - 10:00 PM', '9:00 AM - 10:00 PM', '9:00 AM - 11:00 PM', '10:00 AM - 11:00 PM', '10:00 AM - 10:00 PM'] },
  { name: 'Parlour Pioneer Square', address: '119 Yesler Way', lat: 47.6016261, lng: -122.3330749, rating: 4.9, reviews: 36, maps: m + '14852882420276040766', hours: ['Closed', '9:00 AM - 3:00 PM', '9:00 AM - 3:00 PM', '9:00 AM - 3:00 PM', '9:00 AM - 3:00 PM', 'Closed', 'Closed'] },
  { name: 'Caffe Umbria', address: '320 Occidental Ave S', lat: 47.5994714, lng: -122.3326771, rating: 4.6, reviews: 792, maps: m + '2318912048857809596', hours: [...d('7:00 AM - 5:00 PM').slice(0, 5), '7:00 AM - 4:00 PM', '8:00 AM - 4:00 PM'] },
  { name: 'Anchor & Bloom Cafe', address: '2121 1st Ave', lat: 47.6121027, lng: -122.3449332, rating: 4.8, reviews: 180, maps: m + '13200695124978625108', hours: [...d('7:30 AM - 3:00 PM').slice(0, 5), '7:30 AM - 4:00 PM', '8:00 AM - 3:00 PM'] },
  { name: 'Anchorhead Coffee (Western)', address: '2003 Western Ave', lat: 47.6109268, lng: -122.3446324, rating: 4.7, reviews: 564, maps: m + '16293102231288980252', hours: [...d('8:00 AM - 3:00 PM').slice(0, 5), '8:00 AM - 4:00 PM', '8:00 AM - 4:00 PM'] },
  { name: 'Caffe Vita at Smith Tower', address: '506 2nd Ave', lat: 47.6019888, lng: -122.3317274, rating: 4.2, reviews: 40, maps: m + '12180492991256119205', hours: [...d('7:00 AM - 5:00 PM').slice(0, 5), '8:00 AM - 3:00 PM', '8:00 AM - 3:00 PM'] },
  { name: 'Ghost Alley Espresso', address: '1499 Post Alley', lat: 47.6086076, lng: -122.340581, rating: 4.6, reviews: 766, maps: m + '13415932426937922897', hours: d('7:00 AM - 4:00 PM') },
];

export const SHOPS: Shop[] = [...COFFEE.map((s) => ({ ...s, kind: 'coffee' as Kind })), ...MORE];

export type LandmarkKind = 'stepped' | 'flare' | 'gable' | 'box' | 'pyramid' | 'needle' | 'wheel' | 'market' | 'notched';
export interface Landmark { name: string; note: string; lat: number; lng: number; height: number; kind: LandmarkKind; size: number; }

// height in meters, size = footprint in meters
export const LANDMARKS: Landmark[] = [
  { name: 'Columbia Center', note: '76 floors, tallest in the city', lat: 47.6049412, lng: -122.3305016, height: 284, kind: 'stepped', size: 55 },
  { name: 'Rainier Square Tower', note: '58 floors, the one with the sloped base', lat: 47.6088755, lng: -122.3343832, height: 259, kind: 'flare', size: 48 },
  { name: '1201 Third Avenue', note: '55 floors, that gabled crown', lat: 47.6071775, lng: -122.3362597, height: 235, kind: 'gable', size: 46 },
  { name: 'Two Union Square', note: '56 floors', lat: 47.6104269, lng: -122.3320911, height: 226, kind: 'notched', size: 46 },
  { name: 'Seattle Municipal Tower', note: '62 floors', lat: 47.6052363, lng: -122.3292755, height: 220, kind: 'box', size: 44 },
  { name: 'Russell Investments Center', note: '42 floors, by the water', lat: 47.6080717, lng: -122.3381287, height: 182, kind: 'box', size: 46 },
  { name: 'Smith Tower', note: '1914, the original skyscraper', lat: 47.6018528, lng: -122.3318583, height: 148, kind: 'pyramid', size: 28 },
  { name: 'Space Needle', note: '605 ft, 1962 World\u2019s Fair', lat: 47.6205063, lng: -122.3492774, height: 184, kind: 'needle', size: 40 },
  { name: 'Seattle Great Wheel', note: 'Pier 57', lat: 47.6061342, lng: -122.3425246, height: 53, kind: 'wheel', size: 50 },
  { name: 'Pike Place Market', note: 'since 1907', lat: 47.6094076, lng: -122.3418358, height: 14, kind: 'market', size: 30 },
];
