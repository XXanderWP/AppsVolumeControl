import { ControllerData } from '_/shared/controller';
import { setProcessVolume } from '../extra/volume.node';
import { HotkeysList } from '_/shared/hotkeys';
import { processes } from './processes';

export class VolumeController {
    id: string;
    name?: string;
    min: number = 0;
    max: number = 100;
    process?: string;
    hotkey = HotkeysList[0];
    status = false;

    get data() {
        return this.process
            ? processes.find((q) => q.name === this.process) ?? undefined
            : undefined;
    }

    get pid() {
        return this.data?.pid ?? 0;
    }

    get volume() {
        return this.data?.volume ?? -1;
    }

    set volume(val) {
        setProcessVolume(this.pid, val);
    }

    get storeData(): ControllerData {
        return {
            id: this.id,
            max: this.max,
            min: this.min,
            name: this.name,
            process: this.process,
            hotkey: this.hotkey,
            status: this.status,
        };
    }

    constructor(data: ControllerData) {
        this.id = data.id;

        if (data.name) {
            this.name = data.name;
        }

        if (data.min) {
            this.min = data.min;
        }

        if (data.max) {
            this.max = data.max;
        }

        if (data.process) {
            this.process = data.process;
        }

        if (data.hotkey) {
            this.hotkey = data.hotkey;
        }

        if (data.status) {
            this.status = data.status;
        }
    }
}
