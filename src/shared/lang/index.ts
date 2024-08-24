import ru from './ru.json';
import en from './en.json';
import uk from './uk.json';
import shared from './shared.json';

export type LangIdName = 'ru' | 'en' | 'uk';

export const langSharedData = {
    ...shared,
};

export const langs = {
    ['en']: {
        ...langSharedData,
        ...en,
    },
    ['uk']: {
        ...langSharedData,
        ...uk,
    },
    ['ru']: {
        ...langSharedData,
        ...ru,
    },
};

export type langData = keyof (typeof langs)[keyof typeof langs];

export type langType = keyof typeof langs;

export const langString = (
    lang: keyof typeof langs,
    id: langData,
    ...args: (number | string | boolean)[]
) => {
    if (!lang) {
        lang = 'en';
    }

    return langStringSystem(lang, id, true, ...args);
};

export const langStringExist = (key: string) => {
    return !!(langs['en'] as any)[key as any];
};

const langStringSystem = (
    lang: keyof typeof langs,
    id: langData,
    deep: boolean,
    ...args: (number | string | boolean)[]
) => {
    // console.log(Object.keys(langs), lang, id);

    if (!getAllLangs().includes(lang)) {
        lang = 'en';
    }

    let string = langs[lang][id] as string;

    if (!string) {
        return '';
    }

    args.map((q, ii) => {
        const i = ii + 1;
        const reg = new RegExp(`%${i}%`, 'gi');

        string = string.replace(reg, String(q));
    });

    if (deep) {
        const test = string.match(new RegExp('%[a-zA-Z-_0-9]+%', 'gi'));

        test?.forEach((value, i) => {
            const res = langStringSystem(
                lang,
                value.replace(new RegExp('%', 'gi'), '') as any,
                false,
                ...args,
            );

            if (res) {
                string = string.replace(value, res);
            }
        });
    }

    return string;
};

export const allLangStrings = (id: langData, ...args: (number | string | boolean)[]) => {
    const res: string[] = [];

    Object.values(langs).forEach((data) => {
        let string = data[id] as string;

        if (!string) {
            return '';
        }

        args.map((q, ii) => {
            const i = ii + 1;
            const reg = new RegExp(`%${i}%`, 'gi');

            string = string.replace(reg, String(q));
        });

        res.push(string);
    });

    return res;
};

export const getAllLangsKeys = () => {
    const res: langData[] = [];

    Object.values(langs).forEach((data) => {
        (Object.keys(data) as any).forEach((key: langData) => {
            if (!res.includes(key)) {
                res.push(key);
            }
        });
    });

    return res;
};

export const getAllLangs = () => {
    return Object.keys(langs) as langType[];
};

export const getAllLangData = () => {
    return langs;
};
