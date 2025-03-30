"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";

export function ColumnModal({ column = {}, onClose, onColumnUpdate, open }) {
	const { id, name: initialName = "" } = column;
	const [name, setName] = React.useState("");
	const [error, setError] = React.useState("");

	React.useEffect(() => {
		setName(initialName);
		setError("");
	}, [initialName]);

	const handleSave = React.useCallback(() => {
		const trimmed = name.trim();

		if (!trimmed) {
			setError("Name is required.");
			return;
		}

		if (trimmed === initialName) {
			onClose?.();
			return;
		}

		onColumnUpdate?.(id, { name: trimmed });
		onClose?.();
	}, [name, initialName, id, onClose, onColumnUpdate]);

	return (
		<Dialog fullWidth maxWidth="sm" onClose={onClose} open={open} aria-labelledby="edit-column-dialog">
			<DialogContent>
				<Stack spacing={3}>
					<FormControl error={!!error}>
						<InputLabel htmlFor="column-name">Name</InputLabel>
						<OutlinedInput
							id="column-name"
							name="name"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								if (error) setError("");
							}}
						/>
						{error && <FormHelperText>{error}</FormHelperText>}
					</FormControl>

					<Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
						<Button color="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={handleSave} variant="contained">
							Save
						</Button>
					</Stack>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
