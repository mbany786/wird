/**
 * Hijri (Islamic) Calendar Utility
 * Converts Gregorian dates to Hijri dates with user-customizable sighting adjustment offset (-2 to +2 days).
 */

export interface HijriDateInfo {
  day: number;
  month: number;
  monthName: string;
  monthNameArabic: string;
  year: number;
  formatted: string;
  formattedArabic: string;
}

const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Ula',
  'Jumada al-Thani',
  'Rajab',
  'Sha\'ban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qi\'dah',
  'Dhu al-Hijjah'
];

const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

export function getHijriDate(gregorianDateStr: string, adjustmentDays: number = 0): HijriDateInfo {
  const parts = gregorianDateStr.split('-').map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);

  if (adjustmentDays !== 0) {
    dt.setDate(dt.getDate() + adjustmentDays);
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });

    const formattedParts = formatter.formatToParts(dt);
    let day = 1;
    let month = 1;
    let year = 1448;

    for (const p of formattedParts) {
      if (p.type === 'day') day = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10);
      if (p.type === 'year') year = parseInt(p.value, 10);
    }

    const monthIndex = Math.max(0, Math.min(11, month - 1));
    const monthName = HIJRI_MONTHS_EN[monthIndex];
    const monthNameArabic = HIJRI_MONTHS_AR[monthIndex];

    return {
      day,
      month,
      monthName,
      monthNameArabic,
      year,
      formatted: `${day} ${monthName} ${year} AH`,
      formattedArabic: `${day} ${monthNameArabic} ${year} ھ`
    };
  } catch (e) {
    // Fallback calculation if Intl islamic calendar is not fully supported
    return {
      day: parts[2],
      month: parts[1],
      monthName: 'Hijri',
      monthNameArabic: 'هجري',
      year: 1448,
      formatted: `${parts[2]} Hijri`,
      formattedArabic: `${parts[2]} هجري`
    };
  }
}
