# Adaptive UI layout — approved implementation handoff

**Status:** layout approved by the user on 31 October 2026, following prototype revision 4. Native implementation is future work. **Colors, gradients, and glass surfaces are now recorded in the [approved color theme handoff](weather-color-theme-handoff.md).**

This document records the approved structure, density, navigation and behavior. The layout prototype's visual styling is provisional; use the separate color theme handoff for the approved palette and surface treatment. Future styling work should preserve the approved layout and information unless the user explicitly revises them.

## Source of truth and scope

- Use this document for the final layout decisions. It supersedes earlier proposals that put the unfolded AQI chart in the Air quality pane or put unfolded Settings in the Weather header.
- Use the existing app for real data, calculations, actions, conditional states and persistence. The prototype uses illustrative weather, astronomy and map content; it is not replacement application logic.
- Preserve all existing functions and data. Compactness must come from composition and alignment, never from removing fields, series, controls or valid values.
- Keep original terminology and icons, especially the wind bearing icon. Do not add explanatory prose, repeated labels, decorative metadata or new features to fill space.
- The approved phone view remains the baseline during further unfolded or styling work.

The local review reference is [weather-adaptive-design.html](/Users/hahastudio/.codex/visualizations/2026/10/29/01a18807-9907-77c2-a93e-f924f0a9e19d/weather-adaptive-design.html), revision 4, reviewed as **Phone · Floating** and **Unfolded**. This is a conversation-rendered HTML fragment, not a standalone production page. The requirements below are self-contained if that local reference is unavailable.

## Navigation and screen composition

| Destination | Phone / folded                                               | Unfolded, with room for two columns                                        |
| ----------- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Weather     | Current conditions, AI summary, alerts and measurements      | Current content on the left; Forecast or Air quality on the right          |
| Forecast    | Separate bottom-navigation destination                       | Right pane within Weather; hourly and daily sections remain visible        |
| Air quality | Detail opened from the Weather AQI measurement               | Replaces Forecast in the right pane; current AQI and pollutants            |
| Charts      | Six compact chart panels in one column                       | Six equal-height panels in three rows of two                               |
| Sun & Moon  | Current app ordering, with time controls collapsed initially | Time controls and Sun/Moon timelines on the left; large Earth on the right |
| Map         | Full content area                                            | Full content area to the right of the rail                                 |
| Settings    | Gear in Weather/index header only                            | Entry anchored at the bottom of the left rail; categories and detail pane  |

**Phone:** floating bottom navigation with Weather, Forecast, Charts, Sky and Map. Keep labels and selected-state feedback. Allow for safe areas and navigation height so the final content is reachable. The Samsung reference was an action toolbar; the approved Weather Monitor treatment uses its floating shape for app navigation.

**Unfolded:** vertical left rail with Weather, Charts, Sky and Map, plus Settings at the bottom. Settings remains available from every destination and receives its own active highlight. Remove the unfolded header gear and the redundant Back button on the root Settings view. Forecast and Air quality are panes within Weather, not additional rail items.

Keep existing refresh actions. Retain sensible Back and deep-link behavior for phone details and unfolded panes. Switching presentation must preserve the selected logical destination.

## Weather and Forecast

### Current conditions

Preserve temperature, condition/icon, feels-like, daily high/low, location, update time, AI summary and its existing controls, active alerts and refresh. Keep the measurements in this row-major order:

| Left                              | Right                        |
| --------------------------------- | ---------------------------- |
| Rain / snow / mixed precipitation | Wind speed, bearing and icon |
| AQI and its detail action         | Visibility                   |
| Humidity                          | Pressure                     |

On unfolded screens, let the existing hero and measurement rows take up additional vertical space. The bottom of the measurement panel must align with the bottom of the right Forecast or Air quality panel. Keep the summary and Details heading with their associated content. Do not add content or stretch text to achieve alignment. Use content-driven sizing and flexible space; retain compact phone spacing.

### Hourly forecast

- Retain all 48 hourly entries and the original Now/clock-time display.
- Every entry keeps the day/night weather icon, temperature, rain probability, precipitation amount, and wind speed/direction.
- Keep the horizontal hourly strip. Sunrise and sunset remain in Sun & Moon, not as entries in this strip.

### Seven-day forecast

All seven rows show their information without a tap or expansion. Use the approved compact three-column composition:

| Date column                 | Temperature column                                       | Weather column                                              |
| --------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| Today or weekday, plus date | Low/high values above a shared aligned temperature track | One weather icon, rain probability and precipitation amount |

Do not repeat the weekday beside Today. Do not add visible weather-condition prose or extra rain/chance icons. Keep a common left edge and width for all seven temperature tracks. Retain accessible condition descriptions.

In the unfolded right pane, keep a **12-pixel prototype gap** between the Next 48 Hours and 7-Day Forecast containers. Daily rows measured 64 pixels at normal prototype text size; use that as a density reference, not a fixed native height that clips larger text. The current-weather side expands to match the forecast, while daily rows stay compact.

### Air quality pane

Preserve both US and China AQI values, status/description, and all available pollutants: PM2.5, PM10, O₃, NO₂ and SO₂ in µg/m³; CO in mg/m³. Keep compact pollutant rows. **The AQI line chart belongs in Charts on both layouts.** Do not duplicate it in the unfolded Air quality pane.

## Charts

Keep the full 48-hour range, real clock times and dates across midnight. Do not introduce a 24-hour selector or replace time labels with Now / +24h / +48h.

The unfolded row-major arrangement is:

| Left panel               | Right panel   |
| ------------------------ | ------------- |
| Temperature + feels-like | Precipitation |
| Wind + gust              | Pressure      |
| China AQI + US AQI       | Humidity      |

- Retain all eight lines plus precipitation bars, with all source samples. There is no Air quality reference/shortcut above the grid.
- All six unfolded panels have equal height. Align their top/bottom edges and plot areas within each row. Phone panels retain their existing compact individual heights.
- Keep horizontal minimum/maximum guides and extrema markers. Selecting a paired series changes its guides; it does not hide either line.
- Retain minimum, maximum and average for every applicable series; precipitation retains total and maximum. Keep a compact shared statistics header and one unit label per chart.
- Retain point inspection, including paired-series values. Show inspection values during interaction instead of adding permanent explanatory labels or another legend.
- Resize plots from their measured parent. Reduce optional tick density when necessary, never data samples or series.

The prototype's equal panel height was approximately 328 pixels at normal text size. Native implementation should equalize content-driven heights rather than hard-code that measurement.

## Sun & Moon

- Keep the existing astronomy calculations, live/preview behavior, elevation/bearing, events, daylight, phase/illumination, timeline markers and above/below-horizon styling. Preserve polar and missing-event states.
- Keep time-shift controls collapsed on initial entry. Expansion retains the date controls, today through +7 days, 00:00–23:59 slider, ±15 minutes and Now. One selected instant drives timelines and Earth together.
- Keep Sunrise, Sunset and Daylight on one row. Keep Moonrise and Moonset on one row. Do not add explanatory Earth legends or redundant subtitles.
- Preserve the current app's dynamic Sun/Moon ordering. The reviewed daytime phone example is Sun → Earth → Moon; do not hard-code sample ordering over existing behavior.
- On unfolded screens, place the time controls and both timelines in the left column. The Sunlight on Earth container starts with that column and stretches to its bottom, including when the time controls expand.
- Center the larger Earth in the available panel space and keep rotation/location controls at the bottom. Preserve day/night shading, observer and subsolar markers, drag rotation, four directional rotation buttons, My location and Sun overhead.
- Preserve the selected time, live/preview state and globe camera across resizing.

## Map and Settings

**Map:** retain all five layers—Weather/radar, Wind, Rain, Temperature and Clouds—plus refresh, pan/zoom, embedded controls/attribution and **Open in browser**. Browser opening must carry the selected layer/location. On unfolded screens use one larger map; do not split it. The prototype map overlays are illustrative and must not replace the real Windy integration.

**Settings:** phone entry remains exclusive to Weather/index. Unfolded entry is at the rail's bottom. Use the existing categories: Appearance, Data & location, Notifications, Weather services, Diagnostics and About; show categories and detail side by side when they fit.

Preserve the existing Dark mode control, every refresh interval (15/30/60/120 minutes), API-key configuration, weather/location refresh, notification test, API request logs and clearing, alert statistics/history actions, and About/credits. Retain existing destructive-action confirmations. Do not add theme choices, fake connection/permission status, provider descriptions or promotional text. Later color work does not itself authorize adding settings.

## Responsive behavior and continuity

These are prototype starting thresholds based on **available window width**, not device model or physical pixels:

| Width reference | Behavior                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------ |
| Below 600       | Floating bottom navigation, one content pane                                               |
| 600–719         | Left rail with one focused pane; Current / Forecast / Air quality selection within Weather |
| 720–839         | Compact two-column composition when both panes remain readable                             |
| 840 and above   | Two-column composition with more available width                                           |

Validate native dp sizing, large fonts, short landscape windows, multi-window use and hinge occlusion before fixing thresholds. Fall back to a focused pane when needed rather than shrinking text or losing fields. Two-column alignment applies when two columns fit.

Keep shared data providers and navigation state above width-dependent presentation. Opening Forecast or Air quality on a phone and then unfolding must show the same detail in Weather's right pane; folding back retains that detail. Preserve chart guides/inspection, hourly scroll position, sky time/camera, map layer/camera where supported, Settings category/edits, and data timestamps. Resizing alone must not trigger a data refresh or reset.

Use native scrolling appropriate to the screen, with reachable content and safe areas. The inline prototype expands to its content; its flow-positioned phone bar and review frame are not a specification for native scrolling physics or screen height. Preserve the real WebView and its state where possible; verify its resize behavior on devices.

For the HTML review reference, keep the ResizeObserver correction: ignore height-only changes, cache widths, skip hidden variants and defer/coalesce redraws into an animation frame. Do not reintroduce synchronous layout writes inside the observer or suppress the resulting error instead of fixing it.

## No functional or stored-data loss

Keep existing storage keys and formats in `utils/weatherStorage.ts`: `DARK_MODE`, `REFRESH_RATE`, `DISMISSED_ALERTS`, `LAST_UPDATED`, `CURRENT_WEATHER`, `FORECAST`, `WEATHER_ALERTS`, `WEATHER_AIR_QUALITY`, `WEATHER_SUMMARY`, `LOCATION`, `CITY_NAME`, `API_KEYS` and `FETCH_LOCK`. Preserve normal lock coordination/expiry, API logger records, alert tracker records and their retention policies.

This is a presentation refactor. No cache flush, key rename, reset, retention change or destructive migration is included. Use synthetic credentials for persistence tests; never print real keys in logs. Maintain all loading, permission, offline, stale/cached, missing-data and error states. Zero is a valid value; missing data must not become an invented zero or disappear silently.

The prototype does not demonstrate every production state. Its omissions never authorize removing existing features, including AI-summary interactions, alerts, astronomy details or backend Settings operations.

## Implementation entry points and sequence

| Area                         | Existing source anchors                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Navigation and screen chrome | `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `components/ScrollingScreen.tsx`                                 |
| Weather and Forecast         | `app/(tabs)/index.tsx`, `app/(tabs)/forecast.tsx`                                                             |
| Charts and AQI               | `app/(tabs)/charts.tsx`, `components/CustomChart.tsx`, `app/air-quality.tsx`                                  |
| Sky and Earth                | `app/(tabs)/sky.tsx`, `components/astronomy/`, `hooks/useAstronomy.ts`                                        |
| Map and Settings             | `app/(tabs)/map.tsx`, `app/settings.tsx`                                                                      |
| Shared data and persistence  | `contexts/WeatherContext.tsx`, `utils/weatherStorage.ts`, `services/apiLogger.ts`, `services/alertTracker.ts` |

1. Read the [approved color theme handoff](weather-color-theme-handoff.md) alongside this layout baseline. Resolve any remaining typography and navigation styling during implementation without changing the approved structure or data.
2. Inventory current fields/actions and establish identical fixtures for old/new presentation. Inspect the current checkout and framework documentation again when implementation starts.
3. Build the adaptive navigation shell and shared pane state; prove fold/unfold continuity with a chart and the existing map before broad styling.
4. Extract reusable content from screen chrome. Compose Weather/Forecast/AQI, the six-chart grid, Sky, Map and Settings without duplicating providers, headers or data fetching.
5. Apply the agreed visual styling, then complete the acceptance checks below. Do not copy the prototype's sample calculations or values into application services.

## Acceptance checks for implementation

- [ ] Every existing field, unit, conditional state and action survives. Compare identical fixtures, including snow/mixed precipitation, zero, missing AQI, alerts, stale data and astronomy edge cases.
- [ ] Phone floating navigation has five destinations; Settings is in Weather/index only. No unintended phone-density changes.
- [ ] Unfolded rail has four primary destinations plus bottom Settings. Settings highlights correctly and remains accessible from every destination.
- [ ] Weather measurement and right-pane bottoms align; hourly/daily forecast panels have a visible gap. Seven compact daily rows and all 48 hourly entries remain available.
- [ ] Charts has six panels on both layouts. Unfolded panels and plot areas align. Both AQI lines, feels-like, gust, all statistics and inspection work; no Air quality shortcut remains.
- [ ] Sky starts with collapsed time controls. Event rows stay compact; Earth panel bottom matches the timelines with controls collapsed and expanded. Time, camera, ordering and gestures work.
- [ ] Map and Open in browser retain the current layer/location, gestures, attribution and error/offline behavior. Settings actions and confirmations remain functional.
- [ ] Upgrade/relaunch with populated synthetic storage, then fold/unfold repeatedly. Stored data and UI state survive, with no resize-only API requests.
- [ ] Validate 320/360/390/600/720/840/1024 dp, large text, portrait/landscape, safe areas, keyboard, screen readers, light/dark appearance, multi-window and real foldable gestures. No overlap, clipping or unreachable controls.
- [ ] Run the repository-required `npm run preflight` and resolve implementation failures before submission.

Revision 4's browser checks covered usable widths of 320, 600, 720, 840 and 958 pixels, exact unfolded column/panel alignment, phone density and the resize-loop fix. Those checks validate the review prototype only. Native feature parity, persistent-data survival, accessibility and device behavior remain implementation acceptance work.

## Deferred decisions

The [color theme handoff](weather-color-theme-handoff.md), approved on 31 October 2026, supplies vivid weather gradients, glass panels, foreground colors, and reference surface measurements. It supersedes the palette in this layout prototype. Detailed typography and final navigation/rail styling remain open; neither handoff introduces new settings or features.
