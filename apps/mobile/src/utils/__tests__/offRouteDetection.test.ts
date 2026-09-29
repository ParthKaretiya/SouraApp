import {
  distanceToSegmentMeters,
  calculateCrossTrackDistanceMeters,
  OffRouteDetector,
} from '../offRouteDetection';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTests() {
  console.log('=== RUNNING LEVEL C.7 OFF-ROUTE DETECTION TEST SUITE ===\n');

  // Sample route line: along 26.1445 latitude (approx Guwahati) from 91.7362 to 91.7400
  const sampleRoute: [number, number][] = [
    [91.7362, 26.1445],
    [91.7380, 26.1445],
    [91.7400, 26.1445],
  ];

  // 1. Math Verification
  console.log('1. Distance Math Verification:');
  const onLineCoord: [number, number] = [91.7370, 26.1445];
  const dOnLine = calculateCrossTrackDistanceMeters(onLineCoord, sampleRoute);
  console.log(`  - On-line coord distance: ${dOnLine.toFixed(2)}m (expected < 1m)`);
  assert(dOnLine < 1, 'On-line coordinate should have near-zero distance');

  // Shift latitude by ~0.0003 deg: ~33.3m (below 50m)
  const d33m = calculateCrossTrackDistanceMeters([91.7370, 26.1448], sampleRoute);
  console.log(`  - 33m offset coord distance: ${d33m.toFixed(2)}m (expected ~33m)`);
  assert(d33m > 25 && d33m < 40, 'Should measure ~33m offset');

  // Shift latitude by ~0.001 deg: ~111m (above 50m)
  const d111m = calculateCrossTrackDistanceMeters([91.7370, 26.1455], sampleRoute);
  console.log(`  - 111m offset coord distance: ${d111m.toFixed(2)}m (expected ~111m)`);
  assert(d111m > 100 && d111m < 125, 'Should measure ~111m offset');

  // Test A: Driver clearly on route (< 50m)
  console.log('\nTest A: Driver on route (< 50m)');
  const detectorA = new OffRouteDetector();
  const resA = detectorA.evaluatePosition(onLineCoord, sampleRoute);
  assert(!resA.isOffRoute, 'Should not be off-route');
  assert(resA.consecutiveOffRouteTicks === 0, 'Consecutive ticks should be 0');
  assert(!resA.shouldTriggerReroute, 'Should not trigger reroute');
  console.log('  ✓ Test A PASSED: No reroute triggered, consecutive = 0');

  // Test B: One GPS position >50m from route
  console.log('\nTest B: One GPS position > 50m from route');
  const detectorB = new OffRouteDetector();
  const resB1 = detectorB.evaluatePosition([91.7370, 26.1455], sampleRoute);
  assert(resB1.isOffRoute, 'Should be detected as off-route');
  assert(resB1.consecutiveOffRouteTicks === 1, 'Consecutive ticks should be 1');
  assert(!resB1.shouldTriggerReroute, 'Should NOT trigger reroute on tick 1');
  console.log('  ✓ Test B PASSED: Tick 1 detected off-route (111m), consecutive = 1, NO reroute');

  // Test C: Two consecutive off-route readings
  console.log('\nTest C: Two consecutive off-route readings');
  const resB2 = detectorB.evaluatePosition([91.7375, 26.1456], sampleRoute);
  assert(resB2.isOffRoute, 'Should be detected as off-route');
  assert(resB2.consecutiveOffRouteTicks === 2, 'Consecutive ticks should be 2');
  assert(!resB2.shouldTriggerReroute, 'Should NOT trigger reroute on tick 2');
  console.log('  ✓ Test C PASSED: Tick 2 detected off-route, consecutive = 2, NO reroute');

  // Test D: Three consecutive off-route readings
  console.log('\nTest D: Three consecutive off-route readings');
  const resB3 = detectorB.evaluatePosition([91.7380, 26.1457], sampleRoute);
  assert(resB3.isOffRoute, 'Should be detected as off-route');
  assert(resB3.consecutiveOffRouteTicks === 3, 'Consecutive ticks should be 3');
  assert(resB3.shouldTriggerReroute, 'MUST trigger reroute on tick 3');
  console.log('  ✓ Test D PASSED: Tick 3 reached threshold (consecutive = 3), triggered reroute');

  // Test E: Driver returns within threshold before 3 ticks -> counter resets
  console.log('\nTest E: Driver returns within threshold before 3 ticks (counter reset)');
  const detectorE = new OffRouteDetector();
  const resE1 = detectorE.evaluatePosition([91.7370, 26.1455], sampleRoute); // off-route
  assert(resE1.consecutiveOffRouteTicks === 1, 'Tick 1 consecutive = 1');
  const resE2 = detectorE.evaluatePosition([91.7372, 26.1456], sampleRoute); // off-route
  assert(resE2.consecutiveOffRouteTicks === 2, 'Tick 2 consecutive = 2');
  const resE3 = detectorE.evaluatePosition(onLineCoord, sampleRoute); // back on route!
  assert(!resE3.isOffRoute, 'Tick 3 is back on route');
  assert(resE3.consecutiveOffRouteTicks === 0, 'Counter MUST reset to 0');
  assert(!resE3.shouldTriggerReroute, 'Should NOT trigger reroute');
  console.log('  ✓ Test E PASSED: Counter reset to 0 immediately upon returning on-route');

  // Test F: While reroute is in progress -> no duplicate reroute requests
  console.log('\nTest F: Concurrency Lock (no duplicate requests while rerouting)');
  // detectorB already triggered reroute on tick 3 and automatically entered isRerouting state
  assert(detectorB.getIsRerouting(), 'Detector should be locked in isRerouting state');
  const resF = detectorB.evaluatePosition([91.7385, 26.1458], sampleRoute);
  assert(resF.isOffRoute, 'Is off-route');
  assert(!resF.shouldTriggerReroute, 'Should NOT trigger reroute while another is pending');
  console.log('  ✓ Test F PASSED: Subsequent off-route tick blocked by isRerouting lock');

  // Test G: On reroute success -> state reset
  console.log('\nTest G: On Reroute Success -> state resets properly');
  detectorB.onRerouteSuccess();
  assert(!detectorB.getIsRerouting(), 'isRerouting should be false');
  assert(detectorB.getConsecutiveTicks() === 0, 'Ticks should be reset to 0');
  console.log('  ✓ Test G PASSED: Detector cleanly reset after successful reroute');

  // Test H: Real Backend Reroute Integration
  console.log('\nTest H: Backend /api/routes/reroute Live Connectivity');
  try {
    // 1. First get an active optimized route between Guwahati and Shillong
    const optimizeRes = await fetch('http://localhost:3000/api/routes/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: [91.7861, 26.1445],
        destination: [91.8933, 25.5788],
      }),
    });
    assert(optimizeRes.ok, `Optimize HTTP status should be 200, got ${optimizeRes.status}`);
    const optimizeData = (await optimizeRes.json()) as any;
    assert(optimizeData && typeof optimizeData.id === 'string', 'Optimize response should contain route id');
    const routeId = optimizeData.id;
    console.log(`  - Active route acquired with ID: ${routeId}`);

    // 2. Call reroute with off-route coords (deviated off NH6)
    const offRouteCoords: [number, number] = [91.8100, 26.0500]; // Off-route position
    const rerouteRes = await fetch('http://localhost:3000/api/routes/reroute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentRouteId: routeId,
        currentCoords: offRouteCoords,
      }),
    });
    assert(rerouteRes.ok, `Reroute HTTP status should be 200, got ${rerouteRes.status}`);
    const rerouteData = (await rerouteRes.json()) as any;
    assert(rerouteData.rerouteRecommended === true, 'rerouteRecommended should be true');
    assert(rerouteData.recommendedRoute != null, 'Should return recommendedRoute');
    const newRoute = rerouteData.recommendedRoute;
    console.log(`  - New route computed: ${newRoute.corridorName}, distance: ${newRoute.distanceKm} km, duration: ${newRoute.durationMinutes} min`);
    assert(newRoute.geometry.coordinates.length > 50, 'New route should contain real road geometry');
    assert(newRoute.steps.length > 0, 'New route should contain turn-by-turn steps');
    console.log('  ✓ Test H PASSED: Live backend reroute succeeded and returned valid RouteData');
  } catch (err) {
    console.error('  ✕ Test H Error:', err);
    throw err;
  }

  // Test I: Backend Error/Fallback Handling
  console.log('\nTest I: Backend Error Handling & App Resiliency');
  const detectorI = new OffRouteDetector();
  // Simulate 3 ticks
  detectorI.evaluatePosition([91.7370, 26.1455], sampleRoute);
  detectorI.evaluatePosition([91.7372, 26.1456], sampleRoute);
  const resI3 = detectorI.evaluatePosition([91.7374, 26.1457], sampleRoute);
  assert(resI3.shouldTriggerReroute, 'Tick 3 triggers reroute');

  // Simulate network failure
  detectorI.onRerouteFailure();
  assert(!detectorI.getIsRerouting(), 'isRerouting lock released after failure');
  // Counter reset to allow retry after cooldown
  assert(detectorI.getConsecutiveTicks() === 0, 'Consecutive ticks reset to 0');
  console.log('  ✓ Test I PASSED: Failure handled cleanly without throwing or locking the app');

  console.log('\n======================================================');
  console.log('ALL 9 TESTS (A through I) PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
