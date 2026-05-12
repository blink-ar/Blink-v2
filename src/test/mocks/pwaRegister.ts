import { vi } from 'vitest';

export const setNeedRefreshMock = vi.fn();
export const updateServiceWorkerMock = vi.fn();

export function useRegisterSW() {
    return {
        needRefresh: [false, setNeedRefreshMock] as [boolean, (value: boolean) => void],
        updateServiceWorker: updateServiceWorkerMock,
    };
}
