/**
 * @file TableToolbar.jsx
 * @module Components/Common/Controls
 *
 * @description
 * Composite toolbar rendered above every data table in Mustashar.
 * Assembles four reusable controls into a single, consistent toolbar row:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  [PageBanner / spacer]  [Search]  [Filter]  [SyncButton] │
 *   └──────────────────────────────────────────────────────────┘
 *
 * The `banner` prop is optional. When supplied, a collapsible <PageBanner>
 * occupies the left slot and auto-closes after 4 seconds via `useAutoClose`.
 * When omitted, a flex spacer pushes the controls to the right instead.
 *
 * All child controls are fully controlled — the parent page owns the state
 * and passes handlers down as props.
 *
 * @example
 * <TableToolbar
 *   search={search}
 *   onSearch={setSearch}
 *   filterOptions={STATUS_OPTIONS}
 *   filterValue={statusFilter}
 *   onFilter={setStatusFilter}
 *   syncEndpoint="/api/products/sync"
 *   onSyncSuccess={refetch}
 *   placeholder="Search products…"
 *   banner="Products marked inactive won't appear in the calculator."
 * />
 */

import SearchInput from './SearchInput';
import DropdownFilter from './DropdownFilter';
import SyncButton from './SyncButton';
import PageBanner from '../PageBanner';
import { useAutoClose } from '../../../hooks/useAutoClose';
import { useTranslation } from 'react-i18next';

/**
 * TableToolbar
 *
 * @param {Object}   props
 * @param {string}   props.search                  - Current search string (controlled).
 * @param {Function} props.onSearch                - Called with the updated search string on keystroke.
 * @param {Array<{ value: string, label: string }>} props.filterOptions
 *                                                 - Options passed to <DropdownFilter>.
 * @param {string}   props.filterValue             - Currently selected filter value (controlled).
 * @param {Function} props.onFilter                - Called with the newly selected filter value.
 * @param {string}   props.syncEndpoint            - POST endpoint URL passed to <SyncButton>.
 * @param {Function} [props.onSyncSuccess]         - Callback fired ~2 s after a successful sync.
 * @param {string}   [props.placeholder]           - Search input placeholder text. Defaults to `'Search...'`.
 * @param {string}   [props.filterWidth]           - Tailwind width class forwarded to <DropdownFilter>.
 * @param {string}   [props.className='']          - Additional Tailwind classes on the root wrapper.
 * @param {string}   [props.banner]                - When provided, renders a collapsible <PageBanner>
 *                                                   in the left slot with this text as content.
 * @returns {JSX.Element}
 */
export default function TableToolbar({
    search,
    onSearch,
    filterOptions,
    filterValue,
    onFilter,
    syncEndpoint,
    onSyncSuccess,
    placeholder,
    filterWidth,
    className = '',
    banner,
}) {
    const { t } = useTranslation('shared');
    /**
     * `bannerVisible` drives the open/closed state of <PageBanner>.
     * `toggleBanner` is passed as the `onToggle` prop.
     * The banner auto-closes after 4 000 ms via the `useAutoClose` hook.
     */
    const [bannerVisible, toggleBanner] = useAutoClose(4000);

    return (
        <div className={`flex flex-col gap-2 lg:flex-row lg:items-center ${className}`}>

            {banner ? (
                <div className="lg:flex-1">
                    <PageBanner visible={bannerVisible} onToggle={toggleBanner}>
                        {banner}
                    </PageBanner>
                </div>
            ) : (
                <div className="hidden lg:block lg:flex-1" />
            )}

            <div className="flex flex-nowrap items-center gap-2">
                <div className="flex-1 min-w-0 lg:flex-none">
                    <SearchInput
                        value={search}
                        onChange={onSearch}
                        placeholder={placeholder ?? t('table_toolbar.default_placeholder')}
                        sanitize={true}
                    />
                </div>

                <div className="shrink-0">
                    <DropdownFilter
                        options={filterOptions}
                        value={filterValue}
                        onChange={onFilter}
                        width={filterWidth}
                    />
                </div>

                <div className="shrink-0">
                    <SyncButton
                        endpoint={syncEndpoint}
                        onSyncSuccess={onSyncSuccess}
                    />
                </div>
            </div>
        </div>
    );
}