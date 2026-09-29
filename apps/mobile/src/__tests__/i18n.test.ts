import i18n from '../i18n';
import { translations } from '../i18n/translations';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runI18nTests() {
  console.log('=== RUNNING PHASE 9 i18n & TRANSLATION TEST SUITE ===\n');

  // 1. Verify all three languages are configured
  const langs = ['en', 'hi', 'as'] as const;
  for (const lang of langs) {
    assert(!!translations[lang], `Language '${lang}' dictionary must exist`);
    assert(!!translations[lang].translation, `Language '${lang}' must have a translation namespace`);
  }
  console.log('✓ All 3 language dictionaries (en, hi, as) are present.');

  // 2. Verify key parity across languages
  const enKeys = Object.keys(translations.en.translation);
  const hiKeys = Object.keys(translations.hi.translation);
  const asKeys = Object.keys(translations.as.translation);

  console.log(`- Total translation keys defined: ${enKeys.length}`);

  for (const key of enKeys) {
    assert(
      key in translations.hi.translation,
      `Missing key '${key}' in Hindi translation`
    );
    assert(
      key in translations.as.translation,
      `Missing key '${key}' in Assamese translation`
    );
  }
  console.log('✓ 100% key parity verified across English, Hindi, and Assamese.');

  // 3. Test dynamic language switching
  console.log('\nTesting dynamic language switching:');

  // Switch to English
  await i18n.changeLanguage('en');
  assert(i18n.language === 'en', 'i18n language should be English');
  assert(i18n.t('appTitle') === 'SauraRoute', 'English appTitle should be SauraRoute');
  assert(i18n.t('driverCockpit') === 'Driver Cockpit', 'English driverCockpit should be Driver Cockpit');
  assert(i18n.t('startNavigation') === 'START NAVIGATION', 'English startNavigation should be START NAVIGATION');
  assert(i18n.t('emergencySos') === 'Emergency SOS', 'English emergencySos should be Emergency SOS');
  console.log('  ✓ English (en) translations resolve correctly.');

  // Switch: English -> Hindi
  await i18n.changeLanguage('hi');
  assert(i18n.language === 'hi', 'i18n language should be Hindi');
  assert(i18n.t('appTitle') === 'सौरारूट', 'Hindi appTitle should be सौरारूट');
  assert(i18n.t('driverCockpit') === 'ड्राइवर कॉकपिट', 'Hindi driverCockpit should be ड्राइवर कॉकपिट');
  assert(i18n.t('startNavigation') === 'नेविगेशन शुरू करें', 'Hindi startNavigation should be नेविगेशन शुरू करें');
  assert(i18n.t('emergencySos') === 'आपातकालीन एसओएस', 'Hindi emergencySos should be आपातकालीन एसओएस');
  console.log('  ✓ Language switch en → hi succeeded and translations resolve in Devanagari.');

  // Switch: Hindi -> Assamese
  await i18n.changeLanguage('as');
  assert(i18n.language === 'as', 'i18n language should be Assamese');
  assert(i18n.t('appTitle') === 'সৌৰাৰুট', 'Assamese appTitle should be সৌৰাৰুট');
  assert(i18n.t('driverCockpit') === 'চালকৰ ককপিট', 'Assamese driverCockpit should be চালকৰ ককপিট');
  assert(i18n.t('startNavigation') === 'নেভিগেচন আৰম্ভ কৰক', 'Assamese startNavigation should be নেভিগেচন আৰম্ভ কৰক');
  assert(i18n.t('emergencySos') === 'জৰুৰীকালীন এছঅ’এছ', 'Assamese emergencySos should be জৰুৰীকালীন এছঅ’এছ');
  console.log('  ✓ Language switch hi → as succeeded and translations resolve in Bengali-Assamese script.');

  // Switch: Assamese -> English
  await i18n.changeLanguage('en');
  assert(i18n.language === 'en', 'i18n language should return to English');
  assert(i18n.t('appTitle') === 'SauraRoute', 'English appTitle should be restored');
  console.log('  ✓ Language switch as → en cycle completed.');

  // 4. Test Interpolation
  const interpolatedHi = i18n.t('criticalCount', { lng: 'hi', count: 3 });
  assert(interpolatedHi === '3 गंभीर', `Expected '3 गंभीर', got '${interpolatedHi}'`);
  const interpolatedAs = i18n.t('inKm', { lng: 'as', dist: '12.4' });
  assert(interpolatedAs === '12.4 কিঃমিঃ ভিতৰত', `Expected '12.4 কিঃমিঃ ভিতৰত', got '${interpolatedAs}'`);
  console.log('✓ Dynamic number/string interpolation tested in non-Latin scripts.');

  console.log('\n======================================================');
  console.log('ALL i18n TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runI18nTests().catch((err) => {
  console.error('i18n Test Failed:', err);
  process.exit(1);
});
