export function getCachedData<T>(key: string): T | null {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        const { date, data } = JSON.parse(cached);
        if (date !== new Date().toLocaleDateString("en-CA")) return null;
        return data as T;
    } catch {
        return null;
    }
}

export function setCachedData(key: string, data: unknown): void {
    try {
        localStorage.setItem(
            key,
            JSON.stringify({
                date: new Date().toLocaleDateString("en-CA"),
                data,
            }),
        );
    } catch {}
}
