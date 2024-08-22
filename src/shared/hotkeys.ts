export const HotkeysList: string[] = [];

['Ctrl', 'Shift', 'Alt'].forEach((modifier) => {
    for (let i = 1; i < 13; i++) {
        HotkeysList.push(`${modifier}+F${i}`);
    }
});
