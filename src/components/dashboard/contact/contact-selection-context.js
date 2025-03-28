"use client";

import * as React from "react";

import { useSelection } from "@/hooks/use-selection";

function noop() {
	// No operation
}

export const ContactsSelectionContext = React.createContext({
	deselectAll: noop,
	deselectOne: noop,
	selectAll: noop,
	selectOne: noop,
	selected: new Set(),
	selectedAny: false,
	selectedAll: false,
});

export function ContactsSelectionProvider({ children, contacts = [] }) {
	const contactIds = React.useMemo(() => contacts.map((contact) => contact.id), [contacts]);
	const selection = useSelection(contactIds);

	return <ContactsSelectionContext.Provider value={{ ...selection }}>{children}</ContactsSelectionContext.Provider>;
}

export function useContactsSelection() {
	return React.useContext(ContactsSelectionContext);
}
