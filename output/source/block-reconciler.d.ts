import { Block } from './models/block';
import { BlockHistory } from './models/block-history';
declare type GetBlockByHash<TBlock> = (hash: string) => Promise<TBlock | null>;
export declare const reconcileBlockHistory: <TBlock extends Block>(getBlockByHash: GetBlockByHash<TBlock>, blockHistory: BlockHistory<TBlock> | Promise<BlockHistory<TBlock>>, newBlock: TBlock, onBlockAdded: (block: TBlock) => Promise<void>, onBlockRemoved: (block: TBlock) => Promise<void>, blockRetention?: number) => Promise<BlockHistory<TBlock>>;
export {};
