"use client";

import * as React from "react";

import { useSelection } from "@/hooks/use-selection";

function noop() {
    // No operation
}

export const OnboardingSelectionContext = React.createContext({
    deselectAll: noop,
    deselectOne: noop,
    selectAll: noop,
    selectOne: noop,
    selected: new Set(),
    selectedAny: false,
    selectedAll: false,
});

export function OnboardingSelectionProvider({ children, onboarding = [] }) {
    const onboardingIds = React.useMemo(() => onboarding.map((onboarding) => onboarding.id), [onboarding]);
    const selection = useSelection(onboardingIds);

    return <OnboardingSelectionContext.Provider value={{ ...selection }}>{children}</OnboardingSelectionContext.Provider>;
}

export function useOnboardingSelection() {
    return React.useContext(OnboardingSelectionContext);
}
