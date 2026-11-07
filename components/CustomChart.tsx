import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useWeather } from '../contexts/WeatherContext';

export interface DataPoint {
  x: number;
  y: number;
  label?: string;
  dateLabel?: string;
  timeOfDay?: 'midnight' | 'noon';
  description?: string;
}
interface CustomChartProps {
  data: DataPoint[];
  color: string;
  data2?: DataPoint[];
  color2?: string;
  unit: string;
  type?: 'line' | 'area' | 'bar';
  showGrid?: boolean;
  height?: number;
  guideSeries?: 0 | 1;
  seriesNames?: [string, string?];
  onInteractionChange?: (active: boolean) => void;
}
const valid = (point: DataPoint) =>
  Number.isFinite(point.x) && Number.isFinite(point.y);
const padding = { top: 20, right: 20, bottom: 20, left: 60 };

export function CustomChart({
  data,
  color,
  data2,
  color2,
  unit,
  type = 'line',
  showGrid = true,
  height = 180,
  guideSeries = 0,
  seriesNames = ['Actual', 'Secondary'],
  onInteractionChange,
}: CustomChartProps) {
  const { theme } = useWeather();
  const gradientId = useId().replace(/:/g, '');
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(Math.max(120, windowWidth - 60));
  const [inspection, setInspection] = useState<number | null>(null);
  const interacting = useRef(false);
  useEffect(
    () => () => {
      if (interacting.current) onInteractionChange?.(false);
    },
    [onInteractionChange],
  );
  const endInteraction = () => {
    interacting.current = false;
    onInteractionChange?.(false);
    setInspection(null);
  };
  const primary = data.filter(valid);
  const secondary = (data2 ?? []).filter(valid);
  const all = [...primary, ...secondary];
  const available = data.length > 0 || (data2?.length ?? 0) > 0;
  const plotWidth = Math.max(1, width - padding.left - padding.right);
  const plotHeight = height - padding.top - padding.bottom;
  const domain = [...data, ...(data2 ?? [])].filter((p) =>
    Number.isFinite(p.x),
  );
  const minX = Math.min(...domain.map((p) => p.x), 0);
  const maxX = Math.max(...domain.map((p) => p.x), minX + 1);
  const nonNegative =
    type === 'bar' || ['mm', 'km/h', '%', ''].includes(unit.trim());
  let minY = all.length ? Math.min(...all.map((p) => p.y)) : 0;
  let maxY = all.length ? Math.max(...all.map((p) => p.y)) : 1;
  if (nonNegative) minY = 0;
  if (unit.includes('hPa')) {
    minY = Math.min(minY, 1003);
    maxY = Math.max(maxY, 1023);
  }
  if (maxY === minY) maxY = minY + 1;
  const extra = nonNegative ? 0 : (maxY - minY) * 0.1;
  const scaleX = (x: number) =>
    padding.left + ((x - minX) / (maxX - minX)) * plotWidth;
  const scaleY = (y: number) =>
    height -
    padding.bottom -
    ((y - minY + extra) / (maxY - minY + 2 * extra)) * plotHeight;
  const path = (points: DataPoint[], area = false) => {
    let result = '';
    let segment: DataPoint[] = [];
    const flush = () => {
      if (!segment.length) return;
      result +=
        segment
          .map((p, i) => {
            const x = scaleX(p.x);
            const y = scaleY(p.y);
            if (i === 0) return `M ${x} ${y}`;
            if (i === 1) return `L ${x} ${y}`;
            const previous = segment[i - 1];
            const middleX = (scaleX(previous.x) + x) / 2;
            return `C ${middleX} ${scaleY(previous.y)}, ${middleX} ${y}, ${x} ${y}`;
          })
          .join(' ') + ' ';
      if (area)
        result += ` L ${scaleX(segment[segment.length - 1].x)} ${height - padding.bottom} L ${scaleX(segment[0].x)} ${height - padding.bottom} Z `;
      segment = [];
    };
    points.forEach((p) => {
      if (valid(p)) segment.push(p);
      else flush();
    });
    flush();
    return result;
  };
  const guides = guideSeries === 1 ? secondary : primary;
  const extrema =
    type !== 'bar' && guides.length
      ? [
          guides.reduce((a, b) => (a.y <= b.y ? a : b)),
          guides.reduce((a, b) => (a.y >= b.y ? a : b)),
        ]
      : [];
  const guideColor = guideSeries === 1 ? (color2 ?? color) : color;
  const inspect = (x: number) => {
    const target =
      minX +
      Math.max(0, Math.min(1, (x - padding.left) / plotWidth)) * (maxX - minX);
    const samples = data.length ? data : (data2 ?? []);
    const closest = samples.reduce(
      (a, p, i) =>
        Math.abs(p.x - target) < Math.abs(samples[a].x - target) ? i : a,
      0,
    );
    setInspection(closest);
  };
  const selected =
    inspection === null ? undefined : (data[inspection] ?? data2?.[inspection]);
  const secondSelected = selected
    ? data2?.find((p) => p.x === selected.x)
    : undefined;
  const display = (p: DataPoint | undefined) =>
    p && valid(p) ? p.y.toFixed(1) : 'Unavailable';
  const inspectionTime = selected?.description || selected?.label || '';
  const inspectionSeries = selected
    ? [
        { name: seriesNames[0], point: selected, color },
        ...(secondSelected
          ? [
              {
                name: seriesNames[1],
                point: secondSelected,
                color: color2 ?? color,
              },
            ]
          : []),
      ]
    : [];
  const inspectText = selected
    ? [
        inspectionTime,
        ...inspectionSeries.map(
          (item) =>
            `${item.name} ${display(item.point)}${valid(item.point) ? unit : ''}`,
        ),
      ]
        .filter(Boolean)
        .join(' · ')
    : '';
  const isClockTick = (point: DataPoint) =>
    point.timeOfDay === 'midnight' ||
    point.timeOfDay === 'noon' ||
    Boolean(point.dateLabel);
  const tooltipWidth = Math.min(220, Math.max(0, width - 16));
  // Restore the original single-row noon/midnight ticks. Thin only labels
  // that would overlap in a narrow pane, keeping the midnight dates first.
  const ticks = (data.length ? data : (data2 ?? [])).filter((p) => p.label);
  const spacedTicks = [
    ...ticks.filter((p) => p.dateLabel),
    ...ticks.filter((p) => !p.dateLabel),
  ]
    .reduce<DataPoint[]>((chosen, point) => {
      const fits = chosen.every(
        (other) =>
          Math.abs(scaleX(point.x) - scaleX(other.x)) >=
          ((point.label?.length ?? 0) + (other.label?.length ?? 0)) * 2.5 + 6,
      );
      if (fits) chosen.push(point);
      return chosen;
    }, [])
    .sort((a, b) => a.x - b.x);
  const axisValue = (amount: number) => {
    if (unit.includes('°C')) return `${Math.round(amount)}`;
    if (unit.includes('mm')) return `${Math.max(0, amount).toFixed(1)}`;
    return `${Math.round(amount)}`;
  };
  const keys =
    Platform.OS === 'web'
      ? {
          onKeyDown: (event: { key: string; preventDefault: () => void }) => {
            if (['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) {
              event.preventDefault();
              setInspection(
                event.key === 'Escape'
                  ? null
                  : Math.max(
                      0,
                      Math.min(
                        data.length - 1,
                        (inspection ?? 0) +
                          (event.key === 'ArrowLeft' ? -1 : 1),
                      ),
                    ),
              );
            }
          },
        }
      : {};
  return (
    <View
      testID="chart-plot"
      style={{ width: '100%', minHeight: height }}
      onLayout={(e) => {
        if (e.nativeEvent.layout.width > 0)
          setWidth(e.nativeEvent.layout.width);
      }}
    >
      {!all.length ? (
        <Text
          style={{
            color: theme.textSecondary,
            textAlign: 'center',
            marginTop: 60,
          }}
        >
          {available ? 'No valid data points' : 'No data available'}
        </Text>
      ) : (
        <View
          {...keys}
          style={
            Platform.OS === 'web'
              ? { touchAction: 'none', userSelect: 'none' }
              : undefined
          }
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={
            inspectText ||
            `${seriesNames.filter(Boolean).join(' and ')} chart, ${data.length} samples, ${unit}`
          }
          accessibilityHint="Swipe to inspect each forecast time"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, data.length - 1)}
          aria-valuenow={inspection ?? 0}
          aria-valuetext={inspectText || undefined}
          accessibilityValue={{
            min: 0,
            max: Math.max(0, data.length - 1),
            now: inspection ?? 0,
          }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) =>
            setInspection(
              Math.max(
                0,
                Math.min(
                  data.length - 1,
                  (inspection ?? 0) +
                    (e.nativeEvent.actionName === 'increment' ? 1 : -1),
                ),
              ),
            )
          }
          tabIndex={0}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            interacting.current = true;
            onInteractionChange?.(true);
            inspect(e.nativeEvent.locationX);
            // Match PanResponder's native scroll-blocking grant behavior.
            return true;
          }}
          onResponderMove={(e) => inspect(e.nativeEvent.locationX)}
          onResponderRelease={endInteraction}
          onResponderTerminate={endInteraction}
          onResponderTerminationRequest={() => false}
        >
          <Svg
            pointerEvents="none"
            width={width}
            height={height}
            fontFamily={Platform.OS === 'web' ? 'system-ui' : undefined}
          >
            <Defs>
              <LinearGradient
                id={`area-${gradientId}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <Stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <Stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </LinearGradient>
              {[color, theme.textSecondary].map((barColor, index) => (
                <LinearGradient
                  key={index}
                  id={`bar-${gradientId}-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <Stop offset="0%" stopColor={barColor} stopOpacity={0.8} />
                  <Stop offset="100%" stopColor={barColor} stopOpacity={0.3} />
                </LinearGradient>
              ))}
            </Defs>
            {[0, 1, 2, 3, 4].map((i) => {
              const amount = minY - extra + (i / 4) * (maxY - minY + extra * 2);
              const y = height - padding.bottom - (i / 4) * plotHeight;
              return (
                <React.Fragment key={i}>
                  {showGrid && i > 0 && i < 4 && (
                    <Line
                      testID="svg-line-grid"
                      x1={padding.left}
                      x2={width - padding.right}
                      y1={y}
                      y2={y}
                      stroke={theme.textSecondary}
                      strokeWidth={0.5}
                      strokeOpacity={0.15}
                      strokeDasharray="3,3"
                    />
                  )}
                  <SvgText
                    testID="y-label"
                    x={padding.left - 12}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={12}
                    fontWeight="500"
                    fill={theme.textSecondary}
                  >
                    {axisValue(amount)}
                  </SvgText>
                </React.Fragment>
              );
            })}
            {unit.includes('hPa') && (
              <>
                <Line
                  testID="standard-pressure"
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={scaleY(1013)}
                  y2={scaleY(1013)}
                  stroke={theme.warning}
                  strokeWidth={2}
                  strokeOpacity={0.8}
                  strokeDasharray="5,5"
                />
                <SvgText
                  x={width - padding.right - 5}
                  y={scaleY(1013) - 5}
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="end"
                  fill={theme.warning}
                >
                  Standard (1013 hPa)
                </SvgText>
              </>
            )}
            {extrema.map((p, i) => (
              <React.Fragment key={i}>
                <Line
                  testID="chart-extrema-guide"
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={scaleY(p.y)}
                  y2={scaleY(p.y)}
                  stroke={guideColor}
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                />
                <Circle
                  testID="chart-extrema-marker"
                  cx={scaleX(p.x)}
                  cy={scaleY(p.y)}
                  r={3.5}
                  fill={guideColor}
                  stroke={theme.surface}
                  strokeWidth={1.5}
                />
              </React.Fragment>
            ))}
            {type === 'bar' ? (
              primary.map((p, i) => (
                <Rect
                  testID="svg-rect"
                  key={i}
                  x={
                    scaleX(p.x) -
                    Math.max(4, (plotWidth / Math.max(1, data.length)) * 0.6) /
                      2
                  }
                  y={scaleY(p.y)}
                  width={Math.max(
                    4,
                    (plotWidth / Math.max(1, data.length)) * 0.6,
                  )}
                  height={Math.max(0, scaleY(0) - scaleY(p.y))}
                  fill={`url(#bar-${gradientId}-${isClockTick(p) ? 1 : 0})`}
                  stroke={isClockTick(p) ? theme.textSecondary : color}
                  strokeWidth={1}
                  rx={3}
                  ry={3}
                />
              ))
            ) : (
              <>
                {type === 'area' && (
                  <Path
                    testID="svg-path-area"
                    d={path(data, true)}
                    fill={`url(#area-${gradientId})`}
                  />
                )}
                <Path
                  testID="svg-path"
                  d={path(data)}
                  stroke={color}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </>
            )}
            {data2 && color2 && (
              <Path
                testID="svg-path-2"
                d={path(data2)}
                stroke={color2}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="5, 5"
                fill="none"
              />
            )}
            {type === 'line' &&
              [primary, secondary].map((points, seriesIndex) =>
                points
                  .filter((p) => spacedTicks.some((tick) => tick.x === p.x))
                  .map((p) => (
                    <Circle
                      key={`${seriesIndex}-${p.x}`}
                      cx={scaleX(p.x)}
                      cy={scaleY(p.y)}
                      r={3}
                      fill={seriesIndex === 1 ? color2 : color}
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={2}
                    />
                  )),
              )}
            {spacedTicks.map((p) => (
              <SvgText
                testID="x-label"
                key={p.x}
                x={scaleX(p.x)}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                fontSize={10}
                fontWeight={isClockTick(p) ? '600' : '500'}
                fill={theme.textSecondary}
              >
                {p.label}
              </SvgText>
            ))}
            {selected && (
              <>
                <Line
                  testID="chart-inspection-line"
                  x1={scaleX(selected.x)}
                  x2={scaleX(selected.x)}
                  y1={padding.top}
                  y2={height - padding.bottom}
                  stroke={theme.textSecondary}
                  strokeOpacity={0.6}
                  strokeDasharray="3 3"
                />
                {inspectionSeries
                  .filter((item) => valid(item.point))
                  .map((item, index) => (
                    <Circle
                      key={index}
                      testID="chart-inspection-marker"
                      cx={scaleX(item.point.x)}
                      cy={scaleY(item.point.y)}
                      r={4}
                      fill={item.color}
                      stroke={theme.surface}
                      strokeWidth={2}
                    />
                  ))}
              </>
            )}
          </Svg>
        </View>
      )}
      {selected && (
        <View
          testID="chart-inspection"
          pointerEvents="none"
          style={[
            styles.inspection,
            {
              top: 8,
              left:
                scaleX(selected.x) < width / 2 ? width - tooltipWidth - 8 : 8,
              width: tooltipWidth,
              backgroundColor: theme.surface,
              borderColor: theme.divider,
            },
          ]}
        >
          {inspectionTime ? (
            <Text
              style={[styles.inspectionTime, { color: theme.textSecondary }]}
            >
              {inspectionTime}
            </Text>
          ) : null}
          {inspectionSeries.map((item, index) => (
            <View key={index} style={styles.inspectionRow}>
              <Text style={[styles.inspectionName, { color: item.color }]}>
                {item.name}
              </Text>
              <Text style={[styles.inspectionValue, { color: theme.text }]}>
                {display(item.point)}
                {unit && valid(item.point) ? (
                  <Text
                    style={[
                      styles.inspectionUnit,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {' '}
                    {unit}
                  </Text>
                ) : null}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inspection: {
    position: 'absolute',
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  },
  inspectionTime: { fontSize: 12, fontWeight: '500' },
  inspectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  inspectionName: { fontSize: 12, flexShrink: 1 },
  inspectionValue: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  inspectionUnit: { fontSize: 11, fontWeight: '400' },
});
