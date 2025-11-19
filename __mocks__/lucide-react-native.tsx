import React from 'react';
import { View } from 'react-native';

// This is a generic mock for lucide-react-native.
// It replaces any icon with a simple View component.

const createIcon = (name: string) => (props: any) => (
  <View testID={`mock-icon-${name}`} {...props} />
);

const handler = {
  get: function (target: any, prop: string) {
    return createIcon(prop);
  },
};

module.exports = new Proxy({}, handler);
