'use client';

import { useMemo } from 'react';

/**
 * Groups fields into tab → group → fields format
 * @param {Array} fields - fields from the collection config
 * @param {number} activeTabIndex - current active tab index
 */
export function useGroupedFields(fields = [], activeTabIndex = 0) {
  const tabsWithGroups = useMemo(() => {
    if (!Array.isArray(fields)) return {};
    return fields.reduce((acc, field) => {
      const tab = field.tab || 'General';
      const group = field.group || ''; // ❗️Use empty string to denote ungrouped
      if (!acc[tab]) acc[tab] = {};
      if (!acc[tab][group]) acc[tab][group] = [];
      acc[tab][group].push(field);
      return acc;
    }, {});
  }, [fields]);

  const tabNames = Object.keys(tabsWithGroups);
  const currentTab = tabsWithGroups[tabNames[activeTabIndex]] || {};

  const currentTabGroups = Object.keys(currentTab).length === 1 && currentTab['']
    ? { Fields: currentTab[''] } // ✅ Flatten unnamed group to a default label
    : currentTab;

  return { tabNames, currentTabGroups };
}
