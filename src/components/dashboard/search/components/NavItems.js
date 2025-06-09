// Example navigation items including search
import { 
  MagnifyingGlass as SearchIcon,
  Buildings as CompanyIcon,
  Folder as ProjectIcon,
  FolderOpen as MediaIcon
} from '@phosphor-icons/react';

export const navItems = [
  // ... other existing nav items
  
  {
    title: 'Search',
    path: '/dashboard/search',
    icon: SearchIcon,
    children: [
      {
        title: 'All Collections',
        path: '/dashboard/search',
        icon: SearchIcon,
        description: 'Search across all your data'
      },
      {
        title: 'Companies & Contacts',
        path: '/dashboard/search/company',
        icon: CompanyIcon,
        description: 'Search companies, contacts, and projects'
      },
      {
        title: 'Projects & Tasks', 
        path: '/dashboard/search/project',
        icon: ProjectIcon,
        description: 'Search projects, tasks, and elements'
      },
      {
        title: 'Media & Brand',
        path: '/dashboard/search/media',
        icon: MediaIcon,
        description: 'Search media files and brand assets'
      }
    ]
  },
  
  // ... rest of existing nav items
];

// Example TopNav component integration
export function TopNavWithSearch() {
  return (
    <AppBar position="sticky">
      <Toolbar>
        {/* Logo and other nav items */}
        
        {/* Search Button */}
        <SearchButton variant="button" showShortcut={true} />
        
        {/* Other nav items like notifications, profile, etc. */}
      </Toolbar>
    </AppBar>
  );
}