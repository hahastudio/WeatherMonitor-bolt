export interface AqiStatus {
  label: string;
  color: string;
  description: string;
}

export const getAqiDescription = (aqi: number): AqiStatus => {
  if (aqi <= 50) {
    return {
      label: 'Good',
      color: '#00E400', // Green
      description:
        'Air quality is satisfactory, and air pollution poses little or no risk.',
    };
  } else if (aqi <= 100) {
    return {
      label: 'Moderate',
      color: '#FFFF00', // Yellow
      description:
        'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.',
    };
  } else if (aqi <= 150) {
    return {
      label: 'Unhealthy for Sensitive Groups',
      color: '#FF7E00', // Orange
      description:
        'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
    };
  } else if (aqi <= 200) {
    return {
      label: 'Unhealthy',
      color: '#FF0000', // Red
      description:
        'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.',
    };
  } else if (aqi <= 300) {
    return {
      label: 'Very Unhealthy',
      color: '#8F3F97', // Purple
      description:
        'Health alert: The risk of health effects is increased for everyone.',
    };
  } else {
    return {
      label: 'Hazardous',
      color: '#7E0023', // Maroon
      description:
        'Health warning of emergency conditions: everyone is more likely to be affected.',
    };
  }
};
