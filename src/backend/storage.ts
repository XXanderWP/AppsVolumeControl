import { ControllerData } from '_/shared/controller';
import { langType } from '_/shared/lang';
import Store from 'electron-store';

export const store = new Store<{
    records: ControllerData[];
    lockTop: boolean;
    lang: langType;
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
        lang: {
            type: 'string',
            default: 'en',
        },
    },
});
