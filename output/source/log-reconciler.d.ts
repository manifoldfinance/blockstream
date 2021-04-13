import { Block } from './models/block';
import { Log } from './models/log';
import { Filter, FilterOptions } from './models/filters';
import { LogHistory } from './models/log-history';
export declare const reconcileLogHistoryWithAddedBlock: <TBlock extends Block, TLog extends Log>(getLogs: (filterOptions: FilterOptions) => Promise<TLog[]>, logHistory: LogHistory<TLog> | Promise<LogHistory<TLog>>, newBlock: TBlock, onLogsAdded: (blockHash: string, logs: TLog[]) => Promise<void>, filters?: Filter[], historyBlockLength?: number) => Promise<LogHistory<TLog>>;
export declare const reconcileLogHistoryWithRemovedBlock: <TBlock extends Block, TLog extends Log>(logHistory: LogHistory<TLog> | Promise<LogHistory<TLog>>, removedBlock: TBlock, onLogsRemoved: (blockHash: string, logs: TLog[]) => Promise<void>) => Promise<LogHistory<TLog>>;
