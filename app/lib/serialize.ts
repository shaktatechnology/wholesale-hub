/**
 * Utility to serialize Prisma objects (converting Decimal, Date, and non-plain objects)
 * into plain JS values so they can safely pass from Server Components to Client Components in Next.js.
 */
export function serialize<T>(data: T): T {
    if (data === null || data === undefined) return data;
    return JSON.parse(
        JSON.stringify(data, (key, value) => {
            // If value is a Decimal or object with toNumber method
            if (value && typeof value === "object" && typeof value.toNumber === "function") {
                return value.toNumber();
            }
            return value;
        })
    );
}
