"use client";

import * as React from "react";

import { useSelection } from "@/hooks/use-selection";

function noop() {
	// No operation
}

export const contactsSelectionContext = React.createContext({
	deselectAll: noop,
	deselectOne: noop,
	selectAll: noop,
	selectOne: noop,
	selected: new Set(),
	selectedAny: false,
	selectedAll: false,
});

export function contactsSelectionProvider({ children, contacts = [] }) {
	const contactIds = React.useMemo(() => contacts.map((contact) => contact.id), [contacts]);
	const selection = useSelection(contactIds);

	return <contactsSelectionContext.Provider value={{ ...selection }}>{children}</contactsSelectionContext.Provider>;
}

export function usecontactsSelection() {
	return React.useContext(contactsSelectionContext);
}
