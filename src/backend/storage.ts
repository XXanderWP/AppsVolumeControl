import { ControllerData } from '_/shared/controller';
import Store from 'electron-store';

export const store = new Store<{
    records: ControllerData[];
    lockTop: boolean;
}>({
    fileExtension: 'control',
    schema: {
        records: {
            type: 'array',
            default: [],
        },
        lockTop: {
            type: 'boolean',
            default: false,
        },
    },
});
