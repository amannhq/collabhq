'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HeatmapDataPoint {
  day: number; // 1-7 (Sunday-Saturday)
  hour: number; // 0-23
  value: number;
}

interface HeatmapChartProps {
  title: string;
  description?: string;
  data: HeatmapDataPoint[];
  valueFormatter?: (value: number) => string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function HeatmapChart({
  title,
  description,
  data,
  valueFormatter = (value) => value.toFixed(0),
}: HeatmapChartProps) {
  // Find min and max values for color scaling
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Get color intensity based on value
  const getColor = (value: number) => {
    if (max === min) return 'rgb(59, 130, 246)'; // blue-500
    
    const intensity = (value - min) / (max - min);
    
    // Gradient from light blue to dark blue
    const lightBlue = { r: 219, g: 234, b: 254 }; // blue-100
    const darkBlue = { r: 29, g: 78, b: 216 }; // blue-700
    
    const r = Math.round(lightBlue.r + (darkBlue.r - lightBlue.r) * intensity);
    const g = Math.round(lightBlue.g + (darkBlue.g - lightBlue.g) * intensity);
    const b = Math.round(lightBlue.b + (darkBlue.b - lightBlue.b) * intensity);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Get value for specific day and hour
  const getValue = (day: number, hour: number) => {
    const point = data.find(d => d.day === day && d.hour === hour);
    return point?.value || 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Hour labels */}
            <div className="flex mb-2">
              <div className="w-12" /> {/* Space for day labels */}
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-muted-foreground"
                  style={{ minWidth: '30px' }}
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {DAYS.map((day, dayIndex) => {
              const dayValue = dayIndex + 1; // 1-7
              return (
                <div key={day} className="flex mb-1">
                  {/* Day label */}
                  <div className="w-12 text-xs text-muted-foreground flex items-center">
                    {day}
                  </div>
                  
                  {/* Hour cells */}
                  {HOURS.map(hour => {
                    const value = getValue(dayValue, hour);
                    const color = getColor(value);
                    
                    return (
                      <div
                        key={hour}
                        className="flex-1 aspect-square flex items-center justify-center rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary hover:scale-110"
                        style={{
                          backgroundColor: color,
                          minWidth: '30px',
                          marginRight: '2px',
                        }}
                        title={`${day} ${hour}:00 - ${valueFormatter(value)}`}
                      >
                        {value > 0 && (
                          <span className="text-xs font-medium text-white drop-shadow-sm">
                            {value > 10 ? valueFormatter(value) : ''}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex gap-1">
                {[0, 0.25, 0.5, 0.75, 1].map(intensity => {
                  const value = min + (max - min) * intensity;
                  return (
                    <div
                      key={intensity}
                      className="w-6 h-6 rounded-sm"
                      style={{ backgroundColor: getColor(value) }}
                      title={valueFormatter(value)}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

