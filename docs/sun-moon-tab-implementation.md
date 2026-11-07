# Sun & Moon implementation

Implemented 25 October 2026 from the [approved design](sun-moon-tab-design.md).

## Behavior

The five tabs are Weather, Forecast, Charts, Sky, and Map. Sky opens “Sun & Moon”; the header gear opens the standalone Settings screen, whose existing controls are retained. Back returns to the previous screen, with Weather as the fallback for a direct Settings entry.

One selected UTC instant drives the Sun path, Moon path and phase, sunlight angle, and globe shading. The observer is the active saved/current location. Live values update every minute while Sky is focused and the app is active. The time card starts collapsed, showing the current time and Live status. Tap it to reveal date selection, the slider, and time adjustment buttons. Closing it preserves any preview and shows the selected date in its status. Preview pauses the clock; Now resumes it without resetting the globe camera. Dates cover today through seven days ahead.

The screen shows measurements, controls, and essential state/error labels. Explanatory paragraphs, ordering announcements, source captions, duplicate horizon labels, map legend text, and phase-orientation notes are removed. Descriptive accessibility labels and the bundled geography license are retained.

During daylight, the order is Sun → Sunlight on Earth → Moon. At night it is Moon → Sunlight on Earth → Sun, including when the Moon is below the horizon. The Moon phase precedes its path. The same displayed event timeline controls ordering: sunrise is inclusive and sunset is exclusive. Polar states use the calculated apparent-limb horizon state. An unknown state retains the last known order for that observer. Stable section slots keep the controls, globe camera, and focus mounted across the transition. App color theme is independent of this order.

The ray diagram and globe are alongside each other when space and text size permit; otherwise they stack at their natural heights. The globe supports drag, four direction buttons, My location, and Sun overhead. Camera movement never changes the observer. Every chart has a textual description; time supports keyboard arrows/Home/End, screen-reader adjustment, dragging, and 15-minute buttons. Controls have at least 44-point targets. SVG axis labels scale up to twice their base size, with fewer ticks at larger text sizes; the accompanying native text summaries retain system text scaling.

## Calculation and data

- `astronomy-engine` is pinned to **2.1.19**. It provides geometric topocentric Sun/Moon positions, instantaneous phase and illumination, event searches, and public geocentric coordinate transforms for the globe. SunCalc **2.1.1** was inspected and compared at northern, southern, equatorial, and polar locations. Its local-sky functions are useful, but its apparent-altitude API and lack of public solar equatorial coordinates would require an additional validated geometry helper. Only Astronomy Engine ships.
- `d3-geo` **1.12.1** and its matching types are pinned. Its CommonJS build works with the project's Metro and Jest setup. A simplified 153 KB GeoJSON land dataset is bundled; [provenance and MIT license](../assets/astronomy/LICENSE.md) accompany it. No map tiles, WebView, or texture downloads are required. A 0.001° clipping inset avoids an SVG polygon degeneracy when the camera looks directly toward the Sun; tests cover this case and its opposite.
- The domain boundary uses UTC milliseconds and degrees, with azimuth clockwise from true north. Paths, ground angles, and globe shading use geometric centre coordinates at sea level. Rise/set searches use apparent upper-limb/refraction conventions. Provider event times never distort the calculated paths. Phase-cycle position and illuminated fraction are separate values.
- The existing One Call response gains an optional schema-versioned astronomy snapshot with coordinates, zone, fetch time, and daily event records. It survives foreground/background storage and Caiyun merges. Old caches remain usable; corrupt or unsupported astronomy extensions are discarded independently of weather. Zero, missing, invalid, and wrong-date provider events remain unknown until local calculation resolves them. The UI distinguishes unknown, no event on this date, and all-day horizon states.
- IANA-zone civil-day boundaries handle 23-, 24-, 25-, and fractional-hour DST days. Repeated event/time labels can include UTC offsets. Changing dates preserves wall time, advances a skipped hour, and chooses the first occurrence of a repeated hour. Fixed offsets and unavailable zones are labeled explicitly. Metadata is reused only for matching coordinates, with 0.001° tolerance for provider rounding.
- Paths use 10-minute samples and an in-memory cache capped at 12 observer/day entries. The selected marker is calculated directly. The screen does not fetch weather, request a location automatically, or write preview/camera state to global context. Explicit location recovery uses the existing context action.
- Startup now hydrates saved data before waiting for notification permission, so offline astronomy can render while a prompt is pending. Startup weather refresh and alert delivery still follow the permission decision. A regression test covers both stages.

## Verification

`npm run preflight` passes formatting, TypeScript, lint, and **24 suites / 235 tests**. Tests cover snapshot normalization/hydration, old caches, foreground/background merges, zero added requests from Sky controls, clock focus/AppState lifecycle, date/time preview, time-control collapse/reopen, boundary ordering, a nighttime Moon below the horizon, polar day/night, DST, globe clipping, stable controls/camera, and Settings access after header collapse.

The adapter also passes **12 reference checks** against four airless position records from JPL Horizons and eight USNO rise/set records. [The fixture](../__tests__/fixtures/ephemeris.json) records the source URLs and values. These are published reference tables archived in the Astronomy Engine repository, not values generated by the app. Tolerances are 0.02° for positions and two minutes for events. This is an archived-reference comparison, not a fresh query to an external ephemeris service.

Production exports succeed for web and for iOS/Android Hermes bytecode. These verify bundling and Hermes compilation; they are not installed native-app tests.

The actual web export was exercised using an isolated, offline Shanghai design fixture with test keys and external fetches blocked. Browser checks cover day/night ordering, Moon phase placement, keyboard focus across reordering, slider accessibility values, Now, globe camera independence and backside markers, Settings/back navigation, light and dark appearance, and the 320-pixel stacked layout. Visual inspection found and fixed clipped globe attribution in the stacked layout and the fully shaded Sun-overhead view. The earlier HTML proposal was not used as a substitute for testing the built screen.

No available iOS simulator runtime or connected Android device was present. Native touch gestures, VoiceOver/TalkBack, maximum OS text size, foldable transitions, and native frame timing still need device validation.

## Size and timing

Against baseline commit `13e77e4`, the production web JavaScript grows from about 4.32 MB to 4.71 MB uncompressed, and from 0.76 MB to 0.88 MB with gzip level 9: approximately **0.13 MB additional compressed JavaScript**. This includes the entire feature, engine, projection, and geography; it is not an engine-only package-size claim or a native download-size measurement.

A warmed desktop Node 26.10.0 sample measured about 7.14 ms for an uncached day's two paths and four event searches (eight dates), 0.52 ms for a cached day, 0.10 ms for one selected instant, and 11.76 ms for globe SVG projection at changing camera angles (100 iterations each for the last three). These are indicative local CPU measurements, not Hermes device benchmarks or a guarantee of animation frame rate.

The feature uses the existing weather refresh policy and adds no hosted astronomy service, key, or subscription.
