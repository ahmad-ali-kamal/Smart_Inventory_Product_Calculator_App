// resources/js/Components/Common/TableToolbar.jsx
import SearchInput from './SearchInput';
import DropdownFilter from './DropdownFilter';
import SyncButton from './SyncButton';
import PageBanner from './PageBanner';
import { useAutoClose } from '../../Hooks/useAutoClose';

export default function TableToolbar({
    search,
    onSearch,
    filterOptions,
    filterValue,
    onFilter,
    syncEndpoint,
    onSyncSuccess,
    placeholder = 'Search...',
    filterWidth,
    className = '',
    banner,
}) {
    const [bannerVisible, toggleBanner] = useAutoClose(4000);

    return (
        <div className={`flex items-center gap-2 ${className}`}>

            {banner ? (
                <PageBanner visible={bannerVisible} onToggle={toggleBanner}>
                    {banner}
                </PageBanner>
            ) : (
                <div className="flex-1" />
            )}

            <SearchInput
                value={search}
                onChange={onSearch}
                placeholder={placeholder}
                sanitize={true}
            />
            <DropdownFilter
                options={filterOptions}
                value={filterValue}
                onChange={onFilter}
                width={filterWidth}
            />
            <SyncButton
                endpoint={syncEndpoint}
                onSyncSuccess={onSyncSuccess}
            />
        </div>
    );
}