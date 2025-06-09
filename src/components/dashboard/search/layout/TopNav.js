import SearchButton from '@/components/dashboard/search/components/SearchButton';

export default function TopNav() {
  return (
    <AppBar>
      <Toolbar>
        {/* ... existing nav items */}
        
        {/* Add search button */}
        <SearchButton />
        
        {/* ... rest of nav */}
      </Toolbar>
    </AppBar>
  );
}