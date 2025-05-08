import { FormControl, MenuItem, Select } from '@mui/material';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export const ViewSwitcher = ({ currentView, onChange, views, noLabel = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (newView) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('view', newView);
    router.push(`${pathname}?${params.toString()}`);
    onChange(newView); // Optional: if caller still uses state
  };

  if (!views || Object.keys(views).length < 2) return null;

  return (
    <FormControl
    variant="outlined"
    size="small"
    sx={{
      minWidth: 140,
      height: 40,
      '& .MuiOutlinedInput-root': {
        height: 40,
        padding: '0 14px',
      },
      '& .MuiSelect-select': {
        display: 'flex',
        alignItems: 'center',
      }
    }}
  >
      <Select
        value={currentView}
        onChange={(e) => handleChange(e.target.value)}
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
