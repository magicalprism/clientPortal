import { FormControl, MenuItem, Select } from '@mui/material';

export const ViewSwitcher = ({ currentView, onChange, views, noLabel = false }) => {
  if (!views || Object.keys(views).length < 2) return null;

  return (
    <FormControl
      variant="outlined"
      size="small"
      sx={{
        minWidth: 140,
        height: 40,             // ✅ Force outer container height
        justifyContent: 'center',

        '& .MuiInputBase-root': {
          height: 40,           // ✅ Matches MUI button height
        }
      }}
    >
      <Select
        value={currentView}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        inputProps={{ 'aria-label': 'Select view' }}
      >
        {Object.entries(views).map(([key, view]) => (
          <MenuItem key={key} value={key}>
            {view.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
