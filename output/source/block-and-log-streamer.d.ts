import { Block } from './models/block';
import { Log } from './models/log';
import { Filter, FilterOptions } from './models/filters';
export interface Configuration {
    /** number of blocks to retain in history, defaults to 100 */
    blockRetention?: number;
}
export declare class BlockAndLogStreamer<TBlock extends Block, TLog extends Log> {
    private lastKnownGoodBlockHistory;
    private blockHistory;
    private lastKnownGoodLogHistory;
    private logHistory;
    private pendingCallbacks;
    private readonly blockRetention;
    private readonly getBlockByHash;
    private readonly getLogs;
    private readonly onError;
    private readonly logFilters;
    private readonly onBlockAddedSubscribers;
    private readonly onBlockRemovedSubscribers;
    private readonly onLogsAddedSubscribers;
    private readonly onLogsRemovedSubscribers;
    /**
     * @param getBlockByHash async function that returns a block given a particular hash or null/throws if the block is not found
     * @param getLogs async function that returns the logs matching the given filter
     * @param onError called if a subscriber throws an error, the error will otherwise be swallowed
     * @param configuration additional optional configuration items
     */
    constructor(getBlockByHash: (hash: string) => Promise<TBlock | null>, getLogs: (filterOptions: FilterOptions) => Promise<TLog[]>, onError: (error: Error) => void, configuration?: Configuration);
    readonly reconcileNewBlock: (block: TBlock) => Promise<void>;
    private readonly onBlockAdded;
    private readonly onBlockRemoved;
    private readonly onLogsAdded;
    private readonly onLogsRemoved;
    readonly getLatestReconciledBlock: () => TBlock | null;
    readonly addLogFilter: (filter: Filter) => string;
    readonly removeLogFilter: (token: string) => void;
    readonly subscribeToOnBlockAdded: (onBlockAdded: (block: TBlock) => void) => string;
    readonly unsubscribeFromOnBlockAdded: (token: string) => void;
    readonly subscribeToOnBlockRemoved: (onBlockRemoved: (block: TBlock) => void) => string;
    readonly unsubscribeFromOnBlockRemoved: (token: string) => void;
    readonly subscribeToOnLogsAdded: (onLogsAdded: (blockHash: string, logs: Array<TLog>) => void) => string;
    readonly unsubscribeFromOnLogsAdded: (token: string) => void;
    readonly subscribeToOnLogsRemoved: (onLogsRemoved: (blockHash: string, logs: Array<TLog>) => void) => string;
    readonly unsubscribeFromOnLogsRemoved: (token: string) => void;
}
