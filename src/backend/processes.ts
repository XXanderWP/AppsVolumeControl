import { getProcessesData } from '../extra/volume.node';
import { tasklist } from 'tasklist';
interface ProcessInfo {
    pid: number;
    name: string;
}

export let processes: { pid: number; name: string; volume: number; title: string | null }[] = [];

const tick = async () => {
    console.log('Updating process list');

    // const data = (await getProcessList()).filter((q) => q.name.endsWith('.exe'));
    const data = (await tasklist())
        .filter((q: any) => q.imageName.endsWith('.exe') && q.sessionName !== 'Services')
        .map((q: any) => {
            return { ...q, name: q.imageName };
        });

    console.log(`Loaded ${data?.length} processes`);
    let process: { pid: number; name: string; volume: number; title: string | null }[] = [];

    data.forEach((item: any) => {
        if (!process.find((q) => q.name === item.name)) {
            process.push({
                name: item.name,
                pid: item.pid,
                title: null,
                volume: -1,
            });
        }
    });

    const otherData = getProcessesData(process.map((q) => q.pid));

    process = process.map((itm) => {
        const q = otherData.find((a) => a.pid === itm.pid);

        if (!q) {
            return itm;
        }

        return { ...itm, volume: q.volume, title: q.title };
    });

    process = process.filter((q) => q.volume !== -1);
    processes = process;
    console.log('Process list updated');
};

export const ManualUpdateProcesses = () => {
    return tick();
};

export const SetPidVolume = (pid: number, volume: number) => {
    const index = processes.findIndex((q) => q.pid === pid);

    if (index > -1) {
        processes[index].volume = volume;
    }
};
