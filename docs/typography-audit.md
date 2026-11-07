# Typography audit

Reviewed after the alert, forecast and map refinements on 1 November 2026, then updated after the requested even-size consolidation. Further role and weight consolidation remains a proposal.

## Current inventory

The reachable UI source now declares **11 font sizes**, **6 normalized weights** and **24 size/weight combinations**, down from 14 sizes and 32 combinations. The intended family is the **platform system font**, with no custom font assets loaded by the app.

All odd base sizes were rounded up to the nearest even size: **11 → 12**, **13 → 14**, and **15 → 16**. This covers navigation, forecast captions, chart statistics and axes, weather details, high/low temperatures and Settings categories. Font families and weights are preserved. Accessibility font scaling still applies, so scaled sizes need not be even.

Browser inspection also found an accidental family difference: React Native text used its system font stack, while SVG labels fell back to `PingFang SC` in the review browser. The two plot components explicitly use `system-ui` on web. Native font defaults are unchanged.

| Size | Declared weights        | Current use                                                                |
| ---- | ----------------------- | -------------------------------------------------------------------------- |
| 10   | 500, 600                | Hourly wind, chart time labels and pressure reference                      |
| 12   | 400, 500, 600, 700, 800 | Captions, units, axes, navigation, series controls and alert severity      |
| 14   | 400, 500, 600, 700      | Compact body text, chart statistics, weather labels, metadata and controls |
| 16   | 400, 500, 600, 700      | Body text, form values, temperatures, Settings categories and alert titles |
| 18   | 400, 600, 700           | Compact headings, measurement values and onboarding copy                   |
| 20   | 600                     | Panel headings                                                             |
| 22   | 500                     | Sun/Moon values                                                            |
| 28   | 700                     | Screen headings                                                            |
| 32   | 700                     | Welcome heading                                                            |
| 40   | 700                     | Main AQI values                                                            |
| 66   | 300                     | Current temperature                                                        |

Method: static TypeScript/JSX inventory of `app/` routes and their reachable `components/` imports, including onboarding, Settings and diagnostics. The unused `WeatherCard` component is excluded. Numeric sizes are evaluated at normal font scaling; `bold` is normalized to 700 and unspecified weight to 400. Conditional weights count as separate variants. Nested text inheritance, style overrides and platform font matching mean this is a declaration inventory, not an exact count of rendered variants or styles simultaneously visible on a screen. Colors, italics, spacing and line height are outside the user's size/family/weight definition.

## Does the app have too many styles?

There is avoidable variation, but the problem is inconsistent roles rather than exceeding a universal numerical limit. Material describes five typographic roles in three sizes and provides 15 baseline styles; it also notes that a product probably will not need all of them. This supports selecting a coherent subset rather than restricting an entire data-heavy app to two or three sizes. [Material typography](https://developer.android.com/develop/ui/compose/designsystems/material3#typography)

The large temperature and AQI values, screen headings, body text and small plot labels do different jobs. Collapsing those distinctions would weaken the hierarchy. Selected series and navigation also need visible feedback; weight remains useful now that chart underlines have been removed.

The remaining consolidation candidates are:

- **Caption weights:** 12 px occurs in five weights. Regular captions, emphasized labels and selected states explain some of that, but the alert-only 800 weight could use the existing bold weight.
- **18/20 px panel headings:** these can remain two intentional roles for compact and standard panels. Components should choose by role rather than inventing values locally.
- **32 px Welcome title:** onboarding does not clearly require a separate size from the 28 px screen heading.
- **10 px labels:** compact plot labels are a legitimate exception, but this tiny size needs device readability checks. It should not spread to body copy or essential controls.

## Suggested next typography pass

Centralize eight general roles: screen title (28/700), section title (20/600), compact title (18/600), body (16/400), strong body (16/600), secondary body (14/400), control (14/600), and caption (12/400). Keep explicitly named exceptions for chart labels, navigation states and the 18/22/40/66 px weather values. Preserve dynamic text scaling and verify the small labels on devices.

The even-size pass removes the near-duplicate odd sizes. Centralizing roles and reducing weight variants would be a separate follow-up; this pass preserves the existing hierarchy and weights.
