import { Block } from './block';
import { List as ImmutableList } from 'immutable';
export declare type BlockHistory<TBlock extends Block> = ImmutableList<TBlock>;
