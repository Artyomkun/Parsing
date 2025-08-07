export * from './Collapsible'; 
export * from './CollapsibleTriger';

// Explicitly re-export conflicting exports from CollapsibleContext
export {
  CollapsibleProvider,
  useCollapsibleControls,
  useCollapsibleState
} from './CollapsibleContext';

// Export the rest from CollapsibleContent, excluding conflicting exports
export * from './CollapsibleContent';
