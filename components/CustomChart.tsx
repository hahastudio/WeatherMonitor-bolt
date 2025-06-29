import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Rect } from 'react-native-svg';
import { useWeather } from '../contexts/WeatherContext';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 80;
const chartHeight = 180;
const padding = { top: 20, right: 20, bottom: 40, left: 50 };

interface DataPoint {
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

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height: chartHeight }]}>
        <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
          No data available
        </Text>
      </View>
    );
  }

  // Filter valid data points
  const validData = data.filter(d => 
    typeof d.x === 'number' && 
    typeof d.y === 'number' && 
    !isNaN(d.y) && 
    isFinite(d.y)
  );

  if (validData.length === 0) {
    return (
      <View style={[styles.container, { height: chartHeight }]}>
        <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
          No valid data points
        </Text>
      </View>
    );
  }

  // Calculate scales
  const yValues = validData.map(d => d.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY || 1;
  const yPadding = yRange * 0.1;

  const xScale = (x: number) => padding.left + (x / (validData.length - 1 || 1)) * (chartWidth - padding.left - padding.right);
  const yScale = (y: number) => chartHeight - padding.bottom - ((y - minY + yPadding) / (yRange + 2 * yPadding)) * (chartHeight - padding.top - padding.bottom);

  // Generate path for line/area chart
  const generatePath = () => {
    if (validData.length === 0) return '';
    
    let path = `M ${xScale(0)} ${yScale(validData[0].y)}`;
    
    for (let i = 1; i < validData.length; i++) {
      const x = xScale(i);
      const y = yScale(validData[i].y);
      path += ` L ${x} ${y}`;
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
    const numYLines = 5;
    
    for (let i = 0; i <= numYLines; i++) {
      const y = padding.top + (i / numYLines) * (chartHeight - padding.top - padding.bottom);
      gridLines.push(
        <Line
          key={`grid-y-${i}`}
          x1={padding.left}
          y1={y}
          x2={chartWidth - padding.right}
          y2={y}
          stroke={theme.textSecondary + '20'}
          strokeWidth={1}
        />
      );
    }
    
    return gridLines;
  };

  // Generate Y-axis labels
  const generateYLabels = () => {
    const labels = [];
    const numLabels = 5;
    
    for (let i = 0; i <= numLabels; i++) {
      const value = minY - yPadding + (i / numLabels) * (yRange + 2 * yPadding);
      const y = chartHeight - padding.bottom - (i / numLabels) * (chartHeight - padding.top - padding.bottom);
      
      labels.push(
        <SvgText
          key={`y-label-${i}`}
          x={padding.left - 10}
          y={y + 4}
          fontSize="12"
          fill={theme.textSecondary}
          textAnchor="end"
        >
          {value.toFixed(0)}{unit}
        </SvgText>
      );
    }
    
    return labels;
  };

  // Generate X-axis labels
  const generateXLabels = () => {
    const labels = [];
    const step = Math.max(1, Math.floor(validData.length / 4));
    
    for (let i = 0; i < validData.length; i += step) {
      const dataPoint = validData[i];
      if (dataPoint.label) {
        labels.push(
          <SvgText
            key={`x-label-${i}`}
            x={xScale(i)}
            y={chartHeight - padding.bottom + 20}
            fontSize="10"
            fill={theme.textSecondary}
            textAnchor="middle"
          >
            {dataPoint.label}
          </SvgText>
        );
      }
    }
    
    return labels;
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background + '20',
      borderRadius: 12,
      padding: 8,
    },
    noDataText: {
      fontSize: 14,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {generateGridLines()}
        
        {/* Y-axis */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke={theme.textSecondary + '40'}
          strokeWidth={1}
        />
        
        {/* X-axis */}
        <Line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke={theme.textSecondary + '40'}
          strokeWidth={1}
        />
        
        {/* Chart content */}
        {type === 'bar' ? (
          // Bar chart
          validData.map((point, index) => {
            const barWidth = (chartWidth - padding.left - padding.right) / validData.length * 0.6;
            const x = xScale(index) - barWidth / 2;
            const y = yScale(point.y);
            const height = chartHeight - padding.bottom - y;
            
            return (
              <Rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={height}
                fill={color + '80'}
                stroke={color}
                strokeWidth={1}
              />
            );
          })
        ) : (
          // Line/Area chart
          <>
            <Path
              d={generatePath()}
              fill={type === 'area' ? color + '40' : 'none'}
              stroke={color}
              strokeWidth={type === 'line' ? 3 : 2}
            />
            
            {/* Data points */}
            {type === 'line' && validData.map((point, index) => (
              <Circle
                key={`point-${index}`}
                cx={xScale(index)}
                cy={yScale(point.y)}
                r={3}
                fill={color}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            ))}
          </>
        )}
        
        {/* Labels */}
        {generateYLabels()}
        {generateXLabels()}
      </Svg>
    </View>
  );
};