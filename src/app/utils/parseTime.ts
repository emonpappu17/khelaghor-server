export const parseTimeToMs = (value: string): number => {
    const regex = /^(\d+)([smhd])$/; // supports s, m, h, d
    const match = value.match(regex);

    if (!match) throw new Error(`Invalid time format: ${value}`);

    const [, numStr, unit] = match;
    const num = Number(numStr);

    switch (unit) {
        case "s":
            return num * 1000;
        case "m":
            return num * 60 * 1000;
        case "h":
            return num * 60 * 60 * 1000;
        case "d":
            return num * 24 * 60 * 60 * 1000;
        default:
            throw new Error(`Invalid time unit: ${unit}`);
    }
};