import { getProcessesData } from '../extra/volume.node';
import { tasklist } from 'tasklist';

export let processes: { pid: number; name: string; volume: number; title: string | null }[] = [];

const tick = async () => {
    console.log('Updating process list');

    const tasks = await tasklist();

    const data = tasks
        .filter((q: any) => q.imageName.endsWith('.exe') && q.sessionName !== 'Services')
        .map((q: any) => {
            return { ...q, name: q.imageName };
        });

    console.log(`Loaded ${data?.length} processes`);
    let process: { pid: number; name: string; volume: number; title: string | null }[] = [];

    data.forEach((item: any) => {
        process.push({
            name: item.name,
            pid: item.pid,
            title: null,
            volume: -1,
        });
    });

    const otherData = getProcessesData(process.map((q) => q.pid));

    process = process.map((itm) => {
        const q = otherData.find((a) => a.pid === itm.pid);

        if (!q) {
            return itm;
        }

        return { ...itm, volume: q.volume, title: q.title };
    });

    const processQ = process.filter((q, i) => q.volume !== -1);
    const processRes: typeof process = [];
    const processNames: string[] = [];

    processQ.forEach((q) => {
        if (!processNames.includes(q.name)) {
            processNames.push(q.name);
            processRes.push(q);
        }
    });

    processes = processRes.map((q) => {
        if (!q.title) {
            const title = process.find((a) => a.name === q.name && a.title);

            if (title) {
                q.title = title.title;
            }
        }

        return { ...q };
    });

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
