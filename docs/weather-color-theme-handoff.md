# Weather color theme — approved implementation handoff

**Status:** visual direction approved by the user on 31 October 2026. App implementation is deferred to a later session.

Use **vivid weather gradients and lightly frosted, translucent content containers**. The user explicitly requested more vivid blue, a gradient background, and a glass feeling, then approved the resulting preview. Sunny weather must not return to an orange theme or the earlier muted, pale-blue proposal.

## Source of truth and scope

- The [archived approved preview](previews/weather-colors-vivid.html) contains the exact palettes, surface treatments, and interactions reviewed in this conversation. It is an HTML fragment for the conversation visualization runtime, not a standalone page or production component. This document is self-contained if that runtime is unavailable.
- The [adaptive layout handoff](adaptive-ui-layout-handoff.md) remains authoritative for layout, navigation, information density, fields, actions, and fold/unfold behavior. Apply this color treatment to that layout.
- The small color preview uses sample Shanghai weather, four abbreviated hourly entries, and two measurements solely to demonstrate the surfaces. Its content, sizing, and disclosure are not replacements for the approved full app layout or real weather data.
- The earlier [pale color study](previews/weather-colors.html) is superseded for styling. The vivid preview is the approved reference.
- Gradients and glass are explicit user preferences. Preserve them during later visual cleanup. Keep their execution restrained and readable.

The accepted preview defaults are **Sunny · System appearance · 72% glass fill opacity · 24 px CSS blur**. System appearance is a preview control; its resolved light/dark appearance depends on the host. Approval of the direction is not evidence that every platform and weather state has been visually tested.

## Visual direction

The gradient spans the screen behind the content. Sunny weather moves from saturated blue at the top to bright cyan at the bottom. White hero text and outline weather icons sit over the darker upper region. Content containers let the gradient show through, using a light frost in light appearance and a deep blue frost in dark appearance.

Keep temperature, forecast values, and controls crisp. Use a thin highlight border and a modest shadow to separate the panels. Apply transparency to the **panel background**, never to the whole container and its text. Avoid stacking several translucent surfaces beneath the same content.

Weather changes the background palette. Reading surfaces, text roles, and action colors stay consistent within an appearance. Semantic colors for alerts, AQI, and chart series keep their meaning; disliking orange for sunny weather does not authorize removing an official warning color or recoloring map data.

## Background gradients

All reference gradients are vertical, from top to bottom, with stops at **0%, 58%, and 100%**. Preserve the middle stop: reducing these to a two-color gradient changes the approved appearance and can move the bright region behind white text.

### Light appearance

| Weather      | Top · 0%  | Middle · 58% | Bottom · 100% |
| ------------ | --------- | ------------ | ------------- |
| Sunny        | `#064BCC` | `#0865DF`    | `#6BD6FF`     |
| Cloudy       | `#345D8F` | `#426C9A`    | `#B8D6EB`     |
| Drizzle      | `#005A73` | `#076C81`    | `#78DAD6`     |
| Rain         | `#1147A3` | `#215FB0`    | `#79BCEB`     |
| Snow         | `#285C91` | `#326BA4`    | `#D4F1FF`     |
| Fog / mist   | `#465F79` | `#536D87`    | `#C7D8E2`     |
| Thunderstorm | `#203B76` | `#3B548F`    | `#7D9ED3`     |
| Clear night  | `#101F64` | `#21458F`    | `#5586CE`     |

### Dark appearance

| Weather      | Top · 0%  | Middle · 58% | Bottom · 100% |
| ------------ | --------- | ------------ | ------------- |
| Sunny        | `#06296F` | `#084BAA`    | `#169ADB`     |
| Cloudy       | `#162D51` | `#2B507B`    | `#5484AE`     |
| Drizzle      | `#103B50` | `#15576F`    | `#3FA4B3`     |
| Rain         | `#102E65` | `#214E91`    | `#3C93CE`     |
| Snow         | `#173E66` | `#2A5A83`    | `#73B5D5`     |
| Fog / mist   | `#263D53` | `#3E5870`    | `#819EAD`     |
| Thunderstorm | `#101D45` | `#273769`    | `#526FA3`     |
| Clear night  | `#071437` | `#10275E`    | `#28579D`     |

The preview keys map to current app conditions as follows: `sunny` → `clear` during daytime; `night` → `clear` at night; `cloudy` → `clouds`; `storm` → `thunderstorm`; `fog` → both `mist` and `fog`. Rain, snow, and drizzle retain their names. Cloudy or rainy nights retain their weather condition; do not replace them with a clear-night sky.

## Glass and foreground tokens

These tokens are shared across weather conditions. RGBA values describe the overlay before compositing with the gradient.

| Role                            | Light appearance            | Dark appearance             |
| ------------------------------- | --------------------------- | --------------------------- |
| Hero text and weather icon      | `#FFFFFF`                   | `#FFFFFF`                   |
| Hero secondary text             | `#F0F6FF`                   | `#F0F6FF`                   |
| Glass background                | `rgba(255, 255, 255, 0.72)` | `rgba(7, 27, 59, 0.72)`     |
| Glass highlight border          | `rgba(255, 255, 255, 0.70)` | `rgba(200, 231, 255, 0.28)` |
| Panel primary text              | `#0A2B52`                   | `#F5FAFF`                   |
| Panel secondary text            | `#1C3C61`                   | `#D8E9FC`                   |
| Panel actions and outline icons | `#083877`                   | `#FFFFFF`                   |
| Panel divider                   | `rgba(9, 55, 109, 0.15)`    | `rgba(225, 241, 255, 0.22)` |
| Opaque surface fallback         | `#E7F3FF`                   | `#112C52`                   |
| Panel shadow color              | `rgba(0, 29, 89, 0.12)`     | `rgba(0, 29, 89, 0.12)`     |

Reference panel treatment:

- Glass fill opacity: **72%**. The design control explored **60–88%**, with 72% as the accepted default.
- Backdrop blur: **24 px in CSS**, with a design-control range of **12–32 px**. Native blur intensity is not a pixel-equivalent setting; match the appearance on devices rather than copying 24 into an unrelated intensity parameter.
- Highlight border: **1 px**. Panel radius: **18 px**. Shadow: **0 px horizontal, 5 px vertical, 18 px blur**, using the token above. These are visual reference measurements to adapt to native units and the approved layout.
- The outer 24 px rounded frame belongs to the preview presentation, not a requirement to round the entire native screen.
- Use the opaque fallback and disable blur when reduced transparency is requested or blur is unavailable. Keep the weather gradient around the panels.

The preview's weather, appearance, opacity, and blur controls are review tools. This approval does not add theme pickers, transparency sliders, or other Settings features to the app. Detailed typography and final navigation/rail styling remain separate from this color reference.

## Appearance and day/night behavior

Weather atmosphere and the app's light/dark appearance are separate inputs. Preserve the existing Dark mode preference and storage. A clear-night background must not force a user out of light appearance; a sunny background must also work in dark appearance.

For the clear-day/clear-night selection, use the active weather location's actual day/night information, with the existing weather/astronomy data and an appropriate provider fallback. Do not use a fixed 06:00/18:00 threshold in the device's time zone for a remote city. Preserve the separate Sun & Moon time-preview behavior and section ordering.

This separation needs deliberate implementation: the current `getTheme` uses `isDarkMode || isNightTime()`, where `isNightTime()` reads the device clock. Merely replacing hex values will not deliver the intended behavior. The preview's System option is not approval for a new persistent three-way appearance setting.

## Implementation handoff

Inspect the checkout and installed framework documentation again when implementation starts. Existing entry points, as of this handoff:

| Area                                 | Source                                                                                           | Required work                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Shared theme model                   | [`utils/weatherTheme.ts`](../utils/weatherTheme.ts)                                              | Add three gradient stops and positions; distinguish hero and panel foregrounds, translucent surfaces, opaque fallbacks, actions, and semantic status colors. |
| Shared theme selection               | [`contexts/WeatherContext.tsx`](../contexts/WeatherContext.tsx)                                  | Supply weather, location-aware day/night, and appearance without duplicating shared state or changing stored-data formats.                                   |
| Background and header                | [`components/ScrollingScreen.tsx`](../components/ScrollingScreen.tsx)                            | Replace the two-stop background and coordinate the scrolling title, safe areas, and refresh control with the new foreground roles.                           |
| Navigation and route backgrounds     | [`app/_layout.tsx`](../app/_layout.tsx), [`app/(tabs)/_layout.tsx`](<../app/(tabs)/_layout.tsx>) | Keep route transitions, status bars, navigation, and surrounding surfaces visually consistent with the approved adaptive layout.                             |
| Panels and direct gradient consumers | `components/`, `app/(tabs)/`, `app/settings.tsx`, `app/air-quality.tsx`                          | Apply reusable surface styling; inspect direct gradient uses in Map and API-key settings and all text/action/status consumers.                               |

`expo-linear-gradient` and `expo-blur` are already dependencies. `ScrollingScreen` already has blur-target/header plumbing. Reuse and evaluate that foundation before introducing another effect library. Check Android, iOS, and web behavior and performance; the existing header's intensity is not the approved panel blur value.

Suggested implementation sequence:

1. Introduce semantic tokens and the sixteen gradient palettes. Keep current consumers compatible while migrating them. A single `theme.text` cannot serve both white hero text and dark text on a light glass panel.
2. Separate appearance from location-aware day/night. Preserve existing settings and storage keys; theme selection must not trigger extra weather requests.
3. Apply a stable screen gradient and a reusable glass surface. Keep bare hero text over the darker region at every supported size and scroll state. Charts and dense data panels can use the opaque fallback when needed for readable marks and labels.
4. Migrate screen chrome and components within the approved adaptive layout. Audit `theme.accent`: current consumers mix headings, errors, and alerts, so a global color replacement would conflate different meanings.
5. Preserve weather icons, all forecast fields, chart series, AQI scales, official alert severity, and map-layer colors. Verify device rendering and the acceptance checks below before considering the theme implemented.

## Verification evidence and remaining checks

The reference's JavaScript and DOM checks passed for eight weather choices, light/dark/system appearance, glass controls, forecast disclosure, and saved-state restoration. These are preview checks, not native-app tests.

Calculated contrast was checked using sRGB alpha compositing across all sixteen weather/appearance palettes. Glass calculations sampled both gradient segments at 1% intervals and fill opacities of 60%, 72%, and 88%:

| Text/background case                                       | Lowest calculated ratio |
| ---------------------------------------------------------- | ----------------------- |
| Hero secondary text against the darker top/middle stops    | 4.91:1                  |
| Panel text/actions against sampled translucent backgrounds | 4.64:1                  |
| Panel text/actions against opaque fallback surfaces        | 9.99:1                  |

These calculations exceed the [4.5:1 minimum for ordinary text](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum). They do not establish contrast over the bright lower gradient for bare white hero text, arbitrary imagery, native blur composites, or every scroll position. Browser visual inspection of this color preview was unavailable because local browser use was disabled. Native blur, performance, and accessibility remain implementation work.

Acceptance checks for the later implementation:

- [ ] Sunny weather visibly matches the vivid blue-to-cyan reference, with no orange sunny treatment or return to the pale proposal.
- [ ] All eight weather palettes work in both appearances, including clear night in light mode and sunny weather in dark mode.
- [ ] Glass defaults match the reference; text opacity stays at 100%; fallback surfaces work when transparency or blur is unavailable.
- [ ] Text, icons, selection indicators, and chart marks remain legible over their actual composited surfaces, including scrolling, large text, and phone/unfolded layouts.
- [ ] Hero text stays over a sufficiently dark background; headers, safe areas, navigation, and route transitions have appropriate foreground contrast.
- [ ] Existing Dark mode storage and location-aware day/night behave independently; no new Settings controls or data migrations are introduced by this styling work.
- [ ] Alerts, AQI, map layers, chart meanings, and every field/action required by the adaptive layout handoff are preserved.
- [ ] Verify real Android, iOS, and web rendering, reduced transparency, low-end-device scrolling, and blur fallback behavior.
- [ ] Run the repository-required `npm run preflight` after implementation changes and resolve failures.

This handoff records the approved direction and exact reference values. It does not implement the app theme.
