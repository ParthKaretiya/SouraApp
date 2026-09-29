import { routingService } from './services/routingService.js';

async function test() {
  console.log('[Test] Initiating test route calculation between Guwahati and Shillong...');
  const origin: [number, number] = [91.7362, 26.1118];
  const destination: [number, number] = [91.8833, 25.5788];

  try {
    const route = await routingService.calculateRoute(origin, destination);
    console.log('[Test Success] Route calculated successfully:');
    console.log(`- Distance: ${route.distanceKm} km`);
    console.log(`- Duration: ${route.durationMinutes} min`);
    console.log(`- Geometry coordinates count: ${route.geometry.coordinates.length}`);
    console.log(`- Maneuver steps count: ${route.steps.length}`);
    console.log('- Sample maneuvers:');
    route.steps.slice(0, 3).forEach((s) => {
      console.log(`  * [${s.maneuverType}] ${s.instruction} (${s.distanceMeters}m)`);
    });
    process.exit(0);
  } catch (err) {
    console.error('[Test Failed]', err);
    process.exit(1);
  }
}

test();
