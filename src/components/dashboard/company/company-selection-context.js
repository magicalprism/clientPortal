"use client";

import * as React from "react";

import { useSelection } from "@/hooks/use-selection";

function noop() {
	// No operation
}

export const companiesSelectionContext = React.createContext({
	deselectAll: noop,
	deselectOne: noop,
	selectAll: noop,
	selectOne: noop,
	selected: new Set(),
	selectedAny: false,
	selectedAll: false,
});

export function CompaniesSelectionProvider({ children, companies = [] }) {
	const companyIds = React.useMemo(() => companies.map((company) => company.id), [companies]);
	const selection = useSelection(companyIds);

	return <companiesSelectionContext.Provider value={{ ...selection }}>{children}</companiesSelectionContext.Provider>;
}

export function useCompaniesSelection() {
	return React.useContext(companiesSelectionContext);
}
