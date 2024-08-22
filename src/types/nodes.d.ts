declare module '*volume.node' {
    export function getProcesses(): {
        pid: number;
        name: string;
        path: string;
        title: string;
        volume: number;
    }[];
    export function setProcessVolume(pid: number, volume: number): any[];
}
