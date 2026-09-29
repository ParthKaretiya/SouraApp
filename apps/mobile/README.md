# SauraRoute Driver Mobile App

Client-only mobile navigation cockpit for SauraRoute drivers built with React Native and Expo Dev Client.

---

## Network & Backend API Configuration

The mobile app connects to the `services/api` backend server running at `http://localhost:3000`.

### 1. Android Emulator Testing
Android emulators cannot reach the host machine via `localhost`. The API client automatically defaults to:
```
http://10.0.2.2:3000
```
This loopback address forwards network traffic directly to your host machine's port 3000.

### 2. Physical Android Device Testing (LAN)
When testing on a physical phone over Wi-Fi, set the `EXPO_PUBLIC_API_URL` environment variable to your computer's local IP address:
```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.50:3000"
npm run start
```
Or create a `.env` file inside `apps/mobile/`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
```

---

## Implemented API Endpoints

The centralized client in `src/api/client.ts` targets the following documented contracts:
* `GET /api/health` — System status
* `GET /api/weather` — Real-time weather and precipitation
* `POST /api/routes/optimize` — Multi-point optimized routing
* `POST /api/routes/reroute` — Dynamic hazard avoidance rerouting
* `GET /api/risk/route` — Corridor risk and safety scores
* `GET /api/accessibility` — Closed and restricted corridor stretches
* `GET /api/alerts` — Real-time emergency and traffic advisories
* `GET /api/incidents` & `POST /api/incidents` — Driver hazard reporting

---

## Backend Feature Gap: Emergency SOS Contract Proposal

There is currently **no SOS endpoint** implemented in `services/api`. The mobile app runs Phase 7 against an isolated mock adapter (`src/api/sos.mock.ts`).

To wire this screen to a real backend in future development, `services/api` should implement the following contract:

### `POST /api/sos`
**Request Body (JSON):**
```json
{
  "coordinates": {
    "latitude": 25.9015,
    "longitude": 91.8785
  },
  "timestamp": "2026-09-25T11:20:00.000Z",
  "driverId": "DRV-SAURA-0021",
  "vehicleRegistration": "AS-01-GB-4821",
  "corridorName": "NH-6 Guwahati–Shillong Corridor",
  "emergencyType": "ACCIDENT", // "ACCIDENT" | "MEDICAL" | "VEHICLE_BREAKDOWN" | "ROAD_BLOCK" | "CRIME_SAFETY"
  "additionalNotes": "Commercial transport vehicle overturned on downhill curve"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "sosId": "SOS-NH6-829140",
  "acknowledgedTimestamp": "2026-09-25T11:20:01.200Z",
  "dispatchedResponders": [
    "Highway Patrol Unit 4 (Nongpoh Checkpoint)",
    "108 Emergency Ambulance Dispatch (Ribhoi District)",
    "SauraRoute Fleet Incident Command"
  ],
  "status": "DISPATCHED"
}
```

---

## Multilingual Support (i18n)

The mobile app includes instant localized language switching for commercial drivers operating in Northeast India:
- **English (`EN`)**
- **Hindi (`हिं`)**
- **Assamese (`অস`)**

The driver can switch languages at any time using the 3-way toggle button in the top navigation header (`LanguageSwitcher.tsx`).

---

## Running the App & MapLibre Architecture

### 1. Standalone Prebuilt Dev Client APK (Full Native MapLibre)
The native Android build was generated with `@maplibre/maplibre-react-native` and compiled using OpenJDK 21 & Gradle:
- **APK Location:** `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` (221 MB)
- **Install on Device/Emulator:**
  ```powershell
  adb install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
  ```
- **Start Dev Server:**
  ```powershell
  cd apps/mobile
  npx expo start
  ```
  Open the custom **SauraRoute Driver** app on the device/emulator to load the bundle.

### 2. Standard Expo Go App (Zero-Crash Fallback)
If launched inside standard Expo Go (which lacks native C++ MapLibre TurboModules), the app uses `src/components/map/isMapLibreAvailable.ts` to detect the environment and renders `FallbackCorridorMap.tsx` with turn maneuvers, route geometry, and vehicle positions without crashing.

