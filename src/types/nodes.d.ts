declare module '*volume.node' {
    export function getProcesses(): {
        pid: number;
        name: string;
        path: string;
        title: string;
        volume: number;
    }[];
    export function setVolume(pid: number, volume: number): any[];
    export function getProcessesData(
        pids: number[],
    ): { pid: number; volume: number; title: string }[];
}
