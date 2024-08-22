import { getProcesses } from '../extra/volume.node';

export let processes: ReturnType<typeof getProcesses> = [];

const tick = () => {
    const list = getProcesses();

    // console.log(list);
    processes = list.filter((q) => q && q.volume !== -1);
};

setInterval(() => {
    tick();
}, 5_000);

tick();

export const ManualUpdateProcesses = () => {
    tick();
};
