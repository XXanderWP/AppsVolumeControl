declare module 'tasklist' {
    function tasklist(): Promise<
        {
            imageName: string;
            pid: number;
            sessionName: string;
            sessionNumber: number;
            memUsage: number;
        }[]
    >;
}
