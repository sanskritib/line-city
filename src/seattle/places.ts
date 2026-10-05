import type { Shop } from './data';

// Dinner spots, barbers and florists: places Fo can call or book for you.
// Hours from Google Maps listings (pulled Oct 5, 2026), Monday first.
const d = (s: string) => Array(7).fill(s) as string[];
const m = 'https://maps.google.com/?cid=';

export const MORE: Shop[] = [
  // ---- dinner ----
  { cat: 'dinner', name: 'The Pink Door', address: '1919 Post Alley', lat: 47.6103652, lng: -122.3425604, rating: 4.6, reviews: 7416, maps: m + '13451524338311652394', hours: ['Closed', ...d('11:30 AM - 11:30 PM').slice(0, 5), 'Closed'] },
  { cat: 'dinner', name: "Matt's in the Market", address: '94 Pike St #32', lat: 47.6089023, lng: -122.3405542, rating: 4.5, reviews: 1313, maps: m + '10137347102276822174', hours: [...d('11:30 AM - 2:30 PM, 5:30 PM - 10:00 PM').slice(0, 6), '11:30 AM - 2:30 PM'] },
  { cat: 'dinner', name: 'Place Pigalle', address: '81 Pike St', lat: 47.6083301, lng: -122.3408338, rating: 4.5, reviews: 707, maps: m + '15455887758101686094', hours: [...d('11:30 AM - 9:00 PM').slice(0, 4), '11:30 AM - 9:30 PM', '11:30 AM - 9:30 PM', '11:30 AM - 9:00 PM'] },
  { cat: 'dinner', name: 'Lola', address: '2000 4th Ave', lat: 47.613369, lng: -122.3401471, rating: 4.4, reviews: 4673, maps: m + '15277971614303323470', hours: [...d('7:00 AM - 9:00 PM').slice(0, 5), '8:00 AM - 2:00 PM, 3:00 PM - 9:00 PM', '8:00 AM - 2:00 PM, 3:00 PM - 9:00 PM'] },
  { cat: 'dinner', name: 'Aerlume', address: '2003 Western Ave', lat: 47.6106445, lng: -122.3447539, rating: 4.5, reviews: 884, maps: m + '14058670872054838456', hours: ['Closed', ...d('4:00 PM - 9:00 PM').slice(0, 5), 'Closed'] },
  { cat: 'dinner', name: "Von's 1000Spirits", address: '1225 1st Ave', lat: 47.6066052, lng: -122.3384085, rating: 4.6, reviews: 7827, maps: m + '5056199159300483347', hours: [...d('11:00 AM - 12:00 AM').slice(0, 4), '11:00 AM - 1:00 AM', '11:00 AM - 1:00 AM', '11:00 AM - 12:00 AM'] },
  { cat: 'dinner', name: 'Lonely Siren', address: '1501 Pike Pl, level 2', lat: 47.608559, lng: -122.3407461, rating: 4.7, reviews: 372, maps: m + '4965085892878831593', hours: [...d('3:00 PM - 12:00 AM').slice(0, 4), ...d('12:00 PM - 12:00 AM').slice(0, 3)] },
  { cat: 'dinner', name: 'Alder & Ash', address: '629 Pike St', lat: 47.6113175, lng: -122.3334013, rating: 4.4, reviews: 915, maps: m + '9945884715391476346', hours: d('6:00 AM - 10:00 PM') },
  { cat: 'dinner', name: 'Elephant & Castle', address: '1415 5th Ave', lat: 47.6099215, lng: -122.3355269, rating: 4.5, reviews: 3544, maps: m + '11423718730600995073', hours: [...d('11:30 AM - 12:00 AM').slice(0, 4), '11:30 AM - 2:00 AM', '11:30 AM - 2:00 AM', '11:30 AM - 12:00 AM'] },
  // ---- hair ----
  { cat: 'hair', name: '028 Barber Shop', address: '1123 1st Ave', lat: 47.6059502, lng: -122.3376461, rating: 4.6, reviews: 358, maps: m + '9240942085262153477', hours: [...d('10:00 AM - 7:00 PM').slice(0, 6), '10:00 AM - 5:00 PM'] },
  { cat: 'hair', name: 'Assembly Barbershop', address: '2700 3rd Ave', lat: 47.6174059, lng: -122.3488218, rating: 4.9, reviews: 287, maps: m + '7357696739724883177', hours: d('9:00 AM - 5:00 PM') },
  { cat: 'hair', name: 'Simone David Barbershop', address: '1420 5th Ave #219', lat: 47.6102788, lng: -122.3342157, rating: 4.6, reviews: 86, maps: m + '6622334998734234882', hours: ['8:00 AM - 6:00 PM', '8:00 AM - 7:00 PM', '8:00 AM - 7:00 PM', '8:00 AM - 7:00 PM', '8:00 AM - 6:00 PM', 'Closed', 'Closed'] },
  { cat: 'hair', name: '5th Ave Barber Shop', address: '2000 5th Ave', lat: 47.6139364, lng: -122.339182, rating: 4.5, reviews: 242, maps: m + '5126732053726037266', hours: d('9:00 AM - 7:00 PM') },
  { cat: 'hair', name: 'Squire Barbershop', address: '1917 2nd Ave', lat: 47.6113226, lng: -122.3412579, rating: 4.6, reviews: 413, maps: m + '6471079171859184935', hours: [...d('9:00 AM - 6:00 PM').slice(0, 6), '10:30 AM - 5:00 PM'] },
  { cat: 'hair', name: 'Millheads Barbershop', address: '83 Yesler Way', lat: 47.6015981, lng: -122.3350706, rating: 4.6, reviews: 317, maps: m + '159762727010417895', hours: ['10:00 AM - 5:00 PM', '10:00 AM - 7:00 PM', '10:00 AM - 7:00 PM', '10:00 AM - 7:00 PM', '9:00 AM - 7:00 PM', '9:00 AM - 5:00 PM', 'Closed'] },
  { cat: 'hair', name: 'Belltown Barber', address: '2219 2nd Ave', lat: 47.613514, lng: -122.3452114, rating: 4.5, reviews: 119, maps: m + '12542753685750789004', hours: ['11:00 AM - 5:00 PM', '10:00 AM - 4:30 PM', '10:00 AM - 4:30 PM', '11:00 AM - 5:00 PM', '10:00 AM - 4:30 PM', '10:00 AM - 3:30 PM', '11:00 AM - 5:00 PM'] },
  { cat: 'hair', name: "Rudy's Barbershop", address: '2145 6th Ave', lat: 47.615659, lng: -122.3407966, rating: 4.6, reviews: 1016, maps: m + '1710785030954139017', hours: [...d('10:00 AM - 8:00 PM').slice(0, 4), '9:00 AM - 8:00 PM', '9:00 AM - 7:00 PM', '9:00 AM - 7:00 PM'] },
  // ---- flowers ----
  { cat: 'flowers', name: 'Seattle Flowers', address: '600 2nd Ave', lat: 47.6025293, lng: -122.3324146, rating: 4.8, reviews: 659, maps: m + '326537461652359576', hours: [...d('8:00 AM - 4:30 PM').slice(0, 5), '9:00 AM - 2:00 PM', '9:00 AM - 2:00 PM'] },
  { cat: 'flowers', name: 'Young Flowers', address: '1907 4th Ave', lat: 47.6123957, lng: -122.3392174, rating: 4.9, reviews: 77, maps: m + '17394607514600951991', hours: [...d('9:00 AM - 4:00 PM').slice(0, 5), 'Closed', '9:00 AM - 2:00 PM'] },
  { cat: 'flowers', name: 'Sal Floral Design', address: '1219 1st Ave', lat: 47.6064836, lng: -122.3383732, rating: 4.7, reviews: 18, maps: m + '9388093666808726424', hours: [...d('10:00 AM - 6:00 PM').slice(0, 5), 'Closed', 'Closed'] },
  { cat: 'flowers', name: 'RMC Floral Designs', address: '1420 5th Ave, unit 102A', lat: 47.6104165, lng: -122.3348541, rating: 5.0, reviews: 64, maps: m + '17359352402432385361', hours: [...d('10:00 AM - 6:00 PM').slice(0, 5), '10:00 AM - 3:00 PM', 'Closed'] },
];
