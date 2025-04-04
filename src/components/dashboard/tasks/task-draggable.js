import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function TaskDraggable({ children, id, columnId }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
		data: { type: "task", columnId }, // 👈 include columnId!
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		...(isDragging && { opacity: 0 }),
	};

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			{children}
		</div>
	);
}

