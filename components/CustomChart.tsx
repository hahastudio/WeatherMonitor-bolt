import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useWeather } from '../contexts/WeatherContext';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 60; // Increased chart width
const chartHeight = 180;
const padding = { top: 20, right: 20, bottom: 40, left: 65 }; // Increased left padding for Y-axis labels

export interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface CustomChartProps {
  data: DataPoint[];
  color: string;
  unit: string;
  type?: 'line' | 'area' | 'bar';
  showGrid?: boolean;
}

export const CustomChart: React.FC<CustomChartProps> = ({
  data,
  color,
  unit,
  type = 'line',
  showGrid = true,
}) => {
  const { theme } = useWeather();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      // Remove ALL background styling to prevent Android grey border
    },
    noDataText: {
      fontSize: 14,
      textAlign: 'center',
      fontStyle: 'italic',
      color: theme.textSecondary,
    },
  });

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height: chartHeight }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  // Filter valid data points
  const validData = data.filter(
    (d) =>
      typeof d.x === 'number' &&
      typeof d.y === 'number' &&
      !isNaN(d.y) &&
      isFinite(d.y),
  );

  if (validData.length === 0) {
    return (
      <View style={[styles.container, { height: chartHeight }]}>
        <Text style={styles.noDataText}>No valid data points</Text>
      </View>
    );
  }

  // Calculate scales with special handling for precipitation and pressure
  const yValues = validData.map((d) => d.y);
  let minY = Math.min(...yValues);
  let maxY = Math.max(...yValues);

  // Special handling for precipitation charts - always start from 0
  const isPrecipitationChart = unit.includes('mm');
  const isPressureChart = unit.includes('hPa');

  if (isPrecipitationChart) {
    minY = 0; // Force precipitation charts to start from 0
    // Ensure we have some range even if all values are 0
    if (maxY === 0) {
      maxY = 1; // Show a small range for better visualization
    }
  }

  // For pressure charts, ensure standard pressure (1013 hPa) is visible
  if (isPressureChart) {
    const standardPressure = 1013;
    minY = Math.min(minY, standardPressure - 10); // Ensure some space below standard pressure
    maxY = Math.max(maxY, standardPressure + 10); // Ensure some space above standard pressure
  }

  const yRange = maxY - minY || 1;
  const yPadding = isPrecipitationChart ? 0 : yRange * 0.1; // No padding for precipitation

  const xScale = (x: number) =>
    padding.left +
    (x / (validData.length - 1 || 1)) *
      (chartWidth - padding.left - padding.right);
  const yScale = (y: number) =>
    chartHeight -
    padding.bottom -
    ((y - minY + yPadding) / (yRange + 2 * yPadding)) *
      (chartHeight - padding.top - padding.bottom);

  // Generate path for line/area chart
  const generatePath = () => {
    if (validData.length === 0) return '';

    let path = `M ${xScale(0)} ${yScale(validData[0].y)}`;

    for (let i = 1; i < validData.length; i++) {
      const x = xScale(i);
      const y = yScale(validData[i].y);

      // Use smooth curves for better visual appeal
      if (i === 1) {
        path += ` L ${x} ${y}`;
      } else {
        const prevX = xScale(i - 1);
        const prevY = yScale(validData[i - 1].y);
        const cpX1 = prevX + (x - prevX) * 0.5;
        const cpY1 = prevY;
        const cpX2 = prevX + (x - prevX) * 0.5;
        const cpY2 = y;
        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
      }
    }

    if (type === 'area') {
      path += ` L ${xScale(validData.length - 1)} ${chartHeight - padding.bottom}`;
      path += ` L ${xScale(0)} ${chartHeight - padding.bottom}`;
      path += ' Z';
    }

    return path;
  };

  // Generate grid lines
  const generateGridLines = () => {
    if (!showGrid) return null;

    const gridLines = [];
    const numYLines = 4;

    for (let i = 1; i < numYLines; i++) {
      const y =
        padding.top +
        (i / numYLines) * (chartHeight - padding.top - padding.bottom);
      gridLines.push(
        <Line
          key={`grid-y-${i}`}
          x1={padding.left}
          y1={y}
          x2={chartWidth - padding.right}
          y2={y}
          stroke={theme.textSecondary}
          strokeWidth={0.5}
          strokeOpacity={0.15}
          strokeDasharray="3,3"
        />,
      );
    }

    return gridLines;
  };

  // Generate standard pressure reference line for pressure charts
  const generateStandardPressureLine = () => {
    if (!isPressureChart) return null;

    const standardPressure = 1013;
    const y = yScale(standardPressure);

    // Only show the line if it's within the visible chart area
    if (y < padding.top || y > chartHeight - padding.bottom) return null;

    return (
      <>
        <Line
          x1={padding.left}
          y1={y}
          x2={chartWidth - padding.right}
          y2={y}
          stroke="#FF8800"
          strokeWidth={2}
          strokeOpacity={0.8}
          strokeDasharray="5,5"
        />
        <SvgText
          x={chartWidth - padding.right - 5}
          y={y - 5}
          fontSize="10"
          fill="#FF8800"
          textAnchor="end"
          fontWeight="600"
        >
          Standard (1013 hPa)
        </SvgText>
      </>
    );
  };

  // Generate Y-axis labels with better formatting
  const generateYLabels = () => {
    const labels = [];
    const numLabels = 4;

    for (let i = 0; i <= numLabels; i++) {
      const value = minY - yPadding + (i / numLabels) * (yRange + 2 * yPadding);
      const y =
        chartHeight -
        padding.bottom -
        (i / numLabels) * (chartHeight - padding.top - padding.bottom);

      // Format the value based on the unit
      let formattedValue;
      if (unit.includes('°C')) {
        formattedValue = `${Math.round(value)}°C`;
      } else if (unit.includes('mm')) {
        // For precipitation, show one decimal place and ensure we don't show negative values
        const displayValue = Math.max(0, value);
        formattedValue = `${displayValue.toFixed(1)}mm`;
      } else if (unit.includes('km/h')) {
        formattedValue = `${Math.round(value)}`;
      } else if (unit.includes('hPa')) {
        formattedValue = `${Math.round(value)}`;
      } else if (unit.includes('%')) {
        formattedValue = `${Math.round(value)}%`;
      } else {
        formattedValue = `${Math.round(value)}${unit}`;
      }

      labels.push(
        <SvgText
          key={`y-label-${i}`}
          x={padding.left - 12} // Moved further left
          y={y + 4}
          fontSize="11"
          fill={theme.textSecondary}
          textAnchor="end"
          fontWeight="500"
        >
          {formattedValue}
        </SvgText>,
      );
    }

    return labels;
  };

  // Generate X-axis labels
  const generateXLabels = () => {
    const labels = [];

    for (let i = 0; i < validData.length; i += 1) {
      const dataPoint = validData[i];
      if (dataPoint.label) {
        labels.push(
          <SvgText
            key={`x-label-${i}`}
            x={xScale(i)}
            y={chartHeight - padding.bottom + 16}
            fontSize="10"
            fill={theme.textSecondary}
            textAnchor="middle"
            fontWeight="500"
          >
            {dataPoint.label}
          </SvgText>,
        );
      }
    }

    return labels;
  };

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient
            id={`gradient-${color.replace('#', '')}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </LinearGradient>
          <LinearGradient
            id={`bar-gradient-${color.replace('#', '')}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {generateGridLines()}

        {/* Standard pressure reference line (only for pressure charts) */}
        {generateStandardPressureLine()}

        {/* Chart content */}
        {type === 'bar' ? (
          // Bar chart
          validData.map((point, index) => {
            const barWidth = Math.max(
              4,
              ((chartWidth - padding.left - padding.right) / validData.length) *
                0.6,
            );
            const x = xScale(index) - barWidth / 2;
            const y = yScale(point.y);
            const height = Math.max(2, chartHeight - padding.bottom - y);
            const barColor = point.label ? theme.secondary : color; // Alternate color every 12 bars

            return (
              <Rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={height}
                fill={`url(#bar-gradient-${barColor.replace('#', '')})`}
                stroke={color}
                strokeWidth={1}
                rx={3}
                ry={3}
              />
            );
          })
        ) : (
          // Line/Area chart
          <>
            {type === 'area' && (
              <Path
                d={generatePath()}
                fill={`url(#gradient-${color.replace('#', '')})`}
                stroke="none"
              />
            )}

            <Path
              d={generatePath()}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points for line charts */}
            {type === 'line' &&
              validData.map((point, index) => {
                if (point.label)
                  return (
                    <Circle
                      key={`point-${index}`}
                      cx={xScale(index)}
                      cy={yScale(point.y)}
                      r={3}
                      fill={color}
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={2}
                    />
                  );
                return <></>;
              })}
          </>
        )}

        {/* Labels */}
        {generateYLabels()}
        {generateXLabels()}
      </Svg>
    </View>
  );
};
