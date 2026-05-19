/**
 * @file Card.jsx
 * @module Components/Common/UI
 *
 * @description
 * Primitive surface component used to wrap content in a
 * consistent card container. Applies the shared design-token background color
 * (`--card`), border color (`--border`), and rounded corners.
 *
 * Intentionally minimal — it is a layout primitive, not a feature component.
 * Compose it with header/body/footer patterns by passing children and
 * extending the base styles via `className`.
 *
 * @example
 * // Basic usage
 * <Card>
 *   <p>Some content</p>
 * </Card>
 *
 * @example
 * // With extra padding
 * <Card className="p-6">
 *   <StatGrid />
 * </Card>
 */

/**
 * Card
 *
 * @param {Object}           props
 * @param {React.ReactNode}  props.children    - Content rendered inside the card surface.
 * @param {string}           [props.className] - Additional Tailwind classes merged onto the
 *                                               root element. Defaults to an empty string.
 * @returns {JSX.Element}
 */
export default function Card({ children, className = "" }) {
    return (
        <div
            className={`bg-[var(--card)] border border-[var(--border)] rounded-xl ${className}`}
        >
            {children}
        </div>
    );
}