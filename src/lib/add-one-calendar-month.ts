export function addOneCalendarMonth(date: Date): Date {
    const result = new Date(date);

    const originalDay = result.getDate();

    // Move to the first day of the next month first.
    result.setDate(1);
    result.setMonth(result.getMonth() + 1);

    // Find the last day of the target month.
    const lastDayOfMonth = new Date(
        result.getFullYear(),
        result.getMonth() + 1,
        0,
    ).getDate();

    // Use the original day when possible.
    // Otherwise, use the last day of the target month.
    result.setDate(Math.min(originalDay, lastDayOfMonth));

    return result;
}
