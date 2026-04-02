import { isValid, parseISO, startOfDay } from "date-fns";
import { AppError } from "../errors/AppError";

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

export const parseDate = (dateString: string): Date => {
    const date = parseISO(dateString);
    if (!isValid(date)) {
        throw new AppError(`Invalid date: ${dateString}`, 400);
    }
    return startOfDay(date); // ensures midnight
};

export const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(":").map(Number);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new AppError(`Invalid time: ${timeString}`, 400);
    }

    return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};
