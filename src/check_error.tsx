
import React from 'react';
import { Badge } from './components/ui/badge';

export const TestComponent = () => {
    return <Badge variant="destructive">Test</Badge>;
};

// Check if Badge accepts variant
const b = <Badge variant="default" />;
