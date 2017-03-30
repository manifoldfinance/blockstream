import { reconcileBlockHistory, reconcileLogHistoryWithAddedBlock, reconcileLogHistoryWithRemovedBlock, reconcileBlocksAndLogs, Block, Log, FilterOptions } from "../source/index";
import { MockBlock, MockLog, getBlockByHashFactory, getLogsFactory, delay } from "./helpers";
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as chaiImmutable from "chai-immutable";
import { List as ImmutableList, Record as ImmutableRecord, fromJS } from "immutable";
import "mocha";

chaiUse(chaiImmutable);
chaiUse(chaiAsPromised);

describe("reconcileBlockHistory", () => {
	let newBlockAnnouncements: Block[];
	let blockRemovalAnnouncments: Block[];
	const onBlockAdded = async (block: Block) => { await delay(0); newBlockAnnouncements.push(block); };
	const onBlockRemoved = async (block: Block) => { await delay(0); blockRemovalAnnouncments.push(block); };

	beforeEach(() => {
		newBlockAnnouncements = [];
		blockRemovalAnnouncments = [];
	});

	it("announces new head when first block is added to history", async () => {
		const oldHistory = ImmutableList<Block>();
		const newBlock = new MockBlock(0x7777);

		const newHistory = await reconcileBlockHistory(getBlockByHashFactory(), oldHistory, newBlock, onBlockAdded, onBlockRemoved);

		expect(newHistory.toJS()).to.deep.equal([newBlock]);
		expect(newBlockAnnouncements).to.deep.include(newBlock);
		expect(blockRemovalAnnouncments).to.be.empty;
	});

	it("does not announce new block on repeat of current head", async () => {
		const oldHistory = ImmutableList<Block>([new MockBlock(0x7777)]);
		const newBlock = new MockBlock(0x7777);

		const newHistory = await reconcileBlockHistory(getBlockByHashFactory(), oldHistory, newBlock, onBlockAdded, onBlockRemoved);

		expect(newHistory).to.equal(oldHistory);
		expect(newBlockAnnouncements).to.be.empty;
		expect(blockRemovalAnnouncments).to.be.empty;
	});

	it("announces a new head when nth block is added to history", async () => {
		const oldHistory = ImmutableList<Block>([
			new MockBlock(0x7777),
			new MockBlock(0x7778)
		]);
		const newBlock = new MockBlock(0x7779);

		const newHistory = await reconcileBlockHistory(getBlockByHashFactory(), oldHistory, newBlock, onBlockAdded, onBlockRemoved);

		expect(newHistory.toJS()).to.deep.equal([
			new MockBlock(0x7777),
			new MockBlock(0x7778),
			new MockBlock(0x7779)
		]);
		expect(newBlockAnnouncements).to.deep.equal([newBlock]);
		expect(blockRemovalAnnouncments).to.be.empty;
	});

	it("ignores blocks already in history", async () => {
		const oldHistory = ImmutableList<Block>([
			new MockBlock(0x7777),
			new MockBlock(0x7778),
			new MockBlock(0x7779)
		]);
		const newBlock = new MockBlock(0x7778);

		const newHistory = await reconcileBlockHistory(getBlockByHashFactory(), oldHistory, newBlock, onBlockAdded, onBlockRemoved);

		expect(newHistory).to.equal(oldHistory);
		expect(newBlockAnnouncements).to.be.empty;
		expect(blockRemovalAnnouncments).to.be.empty;
	});

	it("does a multi-block rollback to attach new block to head", async () => {
		const oldHistory = ImmutableList<Block>([
			new MockBlock(0x7777),
			new MockBlock(0x7778),
			new MockBlock(0x7779),
			new MockBlock(0x777A)
		]);
		const newBlock = new MockBlock(0x7779, "BBBB", "AAAA");

		const newHistory = await reconcileBlockHistory(getBlockByHashFactory(), oldHistory, newBlock, onBlockAdded, onBlockRemoved);

		expect(newHistory.toJS()).to.deep.equal([
			new MockBlock(0x7777, "AAAA"),
			new MockBlock(0x7778, "AAAA"),
			new MockBlock(0x7779, "BBBB", "AAAA")
		]);
		expect(newHistory.count()).to.equal(3);
		expect(newBlockAnnouncements).to.deep.equal([newBlock]);
		expect(blockRemovalAnnouncments).to.deep.equal([
			new MockBlock(0x777A),
			new MockBlock(0x7779)
		]);
	});

	it("backfills missing blocks", async () => {
		const oldHistory = ImmutableList<Block>([
			new MockBlock(0x7777),
			new MockBlock(0x7778)
		]);
		const newBlock = new MockBlock(0x777B);

		const newHistory = await reconcileBlockHistory(getBlockByHashFactory(), oldHistory, newBlock, onBlockAdded, onBlockRemoved);

		expect(newHistory.toJS()).to.deep.equal([
			new MockBlock(0x7777),
			new MockBlock(0x7778),
			new MockBlock(0x7779),
			new MockBlock(0x777A),
			new MockBlock(0x777B)
		]);
		expect(newBlockAnnouncements).to.deep.equal([
			new MockBlock(0x7779),
			new MockBlock(0x777A),
			new MockBlock(0x777B)
		]);
		expect(blockRemovalAnnouncments).to.be.empty;
	});

	it("rolls back and backfills if necessary", async () => {
		const oldHistory = ImmutableList<Block>([
			new MockBlock(0x7777),
			new MockBlock(0x7778),
			new MockBlock(0x7779),
			new MockBlock(0x777A)
		]);
		const newBlock = new MockBlock(0x777B, "BBBB", "BBBB");
		const getBlockByHash = getBlockByHashFactory([
			new MockBlock(0x777A, "BBBB", "BBBB"),
			new MockBlock(0x7779, "BBBB", "AAAA")
		]);

		const newHistory = await reconcileBlockHistory(getBlockByHash, oldHistory, newBlock, onBlockAdded, onBlockRemoved);

		expect(newHistory.toJS()).to.deep.equal([
			new MockBlock(0x7777, "AAAA", "AAAA"),
			new MockBlock(0x7778, "AAAA", "AAAA"),
			new MockBlock(0x7779, "BBBB", "AAAA"),
			new MockBlock(0x777A, "BBBB", "BBBB"),
			new MockBlock(0x777B, "BBBB", "BBBB"),
		]);
		expect(newBlockAnnouncements).to.deep.equal([
			new MockBlock(0x7779, "BBBB", "AAAA"),
			new MockBlock(0x777A, "BBBB", "BBBB"),
			new MockBlock(0x777B, "BBBB", "BBBB"),
		]);
		expect(blockRemovalAnnouncments).to.deep.equal([
			new MockBlock(0x777A, "AAAA", "AAAA"),
			new MockBlock(0x7779, "AAAA", "AAAA"),
		]);
	});

	it("throws an exception if backfilling too far", async () => {
		const oldHistory = ImmutableList<Block>([
			new MockBlock(0x7777),
			new MockBlock(0x7778)
		]);
		const newBlock = new MockBlock(0x7778, "BBBB", "BBBB");

		const newHistory = await reconcileBlockHistory(getBlockByHashFactory(), oldHistory, newBlock, onBlockAdded, onBlockRemoved, 5);

		expect(newHistory.toJS()).to.deep.equal([
			new MockBlock(0x7774, "BBBB", "BBBB"),
			new MockBlock(0x7775, "BBBB", "BBBB"),
			new MockBlock(0x7776, "BBBB", "BBBB"),
			new MockBlock(0x7777, "BBBB", "BBBB"),
			new MockBlock(0x7778, "BBBB", "BBBB"),
		]);
		expect(newBlockAnnouncements).to.deep.equal([
			new MockBlock(0x7774, "BBBB", "BBBB"),
			new MockBlock(0x7775, "BBBB", "BBBB"),
			new MockBlock(0x7776, "BBBB", "BBBB"),
			new MockBlock(0x7777, "BBBB", "BBBB"),
			new MockBlock(0x7778, "BBBB", "BBBB"),
		]);
		expect(blockRemovalAnnouncments).to.deep.equal(oldHistory.reverse().toJS());
	});

	it("treats null history same as empty history", async () => {
		const oldHistory = null;
		const newBlock = new MockBlock(0x7777);

		const newHistory = await reconcileBlockHistory(getBlockByHashFactory(), oldHistory, newBlock, onBlockAdded, onBlockRemoved);

		expect(newHistory.toJS()).to.deep.equal([newBlock]);
		expect(newBlockAnnouncements).to.deep.include(newBlock);
		expect(blockRemovalAnnouncments).to.be.empty;
	});

	it("throws if block fetching of parent during backfill fails", async () => {
		const getBlockByHash = async (hash: string): Promise<Block|null> => { await delay(0); return null; }
		const oldHistory = ImmutableList<Block>([
			new MockBlock(0x7777),
			new MockBlock(0x7778)
		]);
		const newBlock = new MockBlock(0x777B);

		const newHistoryPromise = reconcileBlockHistory(getBlockByHash, oldHistory, newBlock, onBlockAdded, onBlockRemoved);

		await expect(newHistoryPromise).to.eventually.be.rejectedWith(Error, "Failed to fetch parent block.");
		expect(newBlockAnnouncements).to.be.empty;
		expect(blockRemovalAnnouncments).to.be.empty;
	});
});

describe("reconcileLogHistoryWithAddedBlock", async () => {
	let newLogAnnouncements: Log[];
	const onLogAdded = async (log: Log) => { await delay(0); newLogAnnouncements.push(log); };

	beforeEach(() => {
		newLogAnnouncements = [];
	});

	it("adds block with no logs", async () => {
		const getLogs = async (filterOptions: FilterOptions[]) => Promise.resolve([]);
		const newBlock = new MockBlock(0x7777);
		const oldLogHistory = null;

		const newLogHistory = await reconcileLogHistoryWithAddedBlock(getLogs, oldLogHistory, newBlock, onLogAdded);

		expect(newLogHistory).to.deep.equal(ImmutableList<Log>());
		expect(newLogAnnouncements).to.be.empty;
	});

	it("adds block with logs", async () => {
		const getLogs = getLogsFactory(1);
		const newBlock = new MockBlock(0x7777);
		const oldLogHistory = null;

		const newLogHistory = await reconcileLogHistoryWithAddedBlock(getLogs, oldLogHistory, newBlock, onLogAdded);

		// unfortunately, because we have an immutable list of a complex object with a nested list of a complex object in it, we can't do a normal equality comparison
		expect(newLogHistory.toJS()).to.deep.equal([new MockLog(0x7777)]);
		expect(newLogAnnouncements).to.deep.equal([new MockLog(0x7777)]);
	});

	it("adds block with multiple logs", async () => {
		const getLogs = getLogsFactory(2);
		const newBlock = new MockBlock(0x7777);
		const oldLogHistory = null;

		const newLogHistory = await reconcileLogHistoryWithAddedBlock(getLogs, oldLogHistory, newBlock, onLogAdded);

		// unfortunately, because we have an immutable list of a complex object with a nested list of a complex object in it, we can't do a normal equality comparison
		expect(newLogHistory.toJS()).to.deep.equal([
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x1),
		]);
		expect(newLogAnnouncements).to.deep.equal([
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x1),
		]);
	});

	it("orders logs by index", async () => {
		const getLogs = async (filterOptions: FilterOptions[]) => Promise.resolve([
			new MockLog(0x7777, 0x1),
			new MockLog(0x7777, 0x2),
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x3),
		]);
		const newBlock = new MockBlock(0x7777);
		const oldLogHistory = null;

		const newLogHistory = await reconcileLogHistoryWithAddedBlock(getLogs, oldLogHistory, newBlock, onLogAdded);

		expect(newLogHistory.toJS()).to.deep.equal([
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x1),
			new MockLog(0x7777, 0x2),
			new MockLog(0x7777, 0x3),
		]);
		expect(newLogAnnouncements).to.deep.equal([
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x1),
			new MockLog(0x7777, 0x2),
			new MockLog(0x7777, 0x3),
		]);
	});

	it("fails if getLogs fails", async () => {
		const getLogs = async (filterOptions: FilterOptions[]) => { await delay(0); throw new Error("apple"); };
		const newBlock = new MockBlock(0x7777);
		const oldLogHistory = null;

		const newLogHistoryPromise = reconcileLogHistoryWithAddedBlock(getLogs, oldLogHistory, newBlock, onLogAdded);

		await expect(newLogHistoryPromise).to.eventually.be.rejectedWith(Error, "apple");
		expect(newLogAnnouncements).to.be.empty;
	});

	it("fails if onNewLog fails", async () => {
		const getLogs = getLogsFactory(1);
		const failingOnLogAdded = async () => { await delay(0); throw new Error("banana"); };
		const newBlock = new MockBlock(0x7777);
		const oldLogHistory = null;

		const newLogHistoryPromise = reconcileLogHistoryWithAddedBlock(getLogs, oldLogHistory, newBlock, failingOnLogAdded);

		await expect(newLogHistoryPromise).to.eventually.rejectedWith(Error, "banana");
	});

	it("fails if old block with logs is added before new block with logs is removed", async () => {
		const getLogs = getLogsFactory(1);
		const firstBlock = new MockBlock(0x7777);
		const secondBlock = new MockBlock(0x7776);
		const oldLogHistory = null;

		const firstLogHistory = await reconcileLogHistoryWithAddedBlock(getLogs, oldLogHistory, firstBlock, onLogAdded);
		const secondLogHistoryPromise = reconcileLogHistoryWithAddedBlock(getLogs, firstLogHistory, secondBlock, onLogAdded);

		await expect(secondLogHistoryPromise).to.eventually.rejectedWith(Error, "received log for a block older than current head log's block");
		// unfortunate reality
		expect(newLogAnnouncements).to.deep.equal([new MockLog(0x7777)]);
	})

	it("fails if multiple logs are received with the same index", async () => {
		const getLogs = async (filterOptions: FilterOptions[]) => Promise.resolve([
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x1),
			new MockLog(0x7777, 0x1),
		]);
		const newBlock = new MockBlock(0x7777);
		const oldLogHistory = null;

		const newLogHistoryPromise = reconcileLogHistoryWithAddedBlock(getLogs, oldLogHistory, newBlock, onLogAdded);

		await expect(newLogHistoryPromise).to.eventually.rejectedWith(Error, "received log with same block number but index newer than previous index");
		// unfortunate reality
		expect(newLogAnnouncements).to.deep.equal([
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x1),
		]);
	});

	it("announces successful log before failing log history update (documented behavior, undesirable)", async () => {
		let first = true;
		const getLogs = getLogsFactory(2);
		const failingOnLogAdded = async (): Promise<void> => {
			await delay(0);
			if (first) first = false;
			else throw new Error("banana");
		};
		const newBlock = new MockBlock(0x7777);
		const oldLogHistory = null;

		const newLogHistoryPromise = reconcileLogHistoryWithAddedBlock(getLogs, oldLogHistory, newBlock, failingOnLogAdded);

		await expect(newLogHistoryPromise).to.eventually.rejectedWith(Error, "banana");
		expect(first).to.be.false;
	});
});

describe("reconcileLogHistoryWithRemovedBlock", async () => {
	let removedLogAnnouncements: Log[];
	const onLogRemoved = async (log: Log) => { await delay(0); removedLogAnnouncements.push(log); };

	beforeEach(() => {
		removedLogAnnouncements = [];
	});

	it("returns empty log history when starting with null log", async () => {
		const removedBlock = new MockBlock(0x7777);
		const oldLogHistory = null;

		const newLogHistory = await reconcileLogHistoryWithRemovedBlock(oldLogHistory, removedBlock, onLogRemoved);

		expect(newLogHistory.toJS()).to.be.empty;
		expect(removedLogAnnouncements).to.be.empty;
	});

	it("handles block removal with no associated logs", async () => {
		const removedBlock = new MockBlock(0x7777);
		const oldLogHistory = ImmutableList<Log>([new MockLog(0x7776)]);

		const newLogHistory = await reconcileLogHistoryWithRemovedBlock(oldLogHistory, removedBlock, onLogRemoved);

		expect(newLogHistory.toJS()).to.deep.equal([new MockLog(0x7776)]);
		expect(removedLogAnnouncements).to.be.empty;
	});

	it("removes logs at head for given block", async () => {
		const removedBlock = new MockBlock(0x7777);
		const oldLogHistory = ImmutableList<Log>([
			new MockLog(0x7775),
			new MockLog(0x7776),
			new MockLog(0x7777),
		]);

		const newLogHistory = await reconcileLogHistoryWithRemovedBlock(oldLogHistory, removedBlock, onLogRemoved);

		expect(newLogHistory.toJS()).to.deep.equal([
			new MockLog(0x7775),
			new MockLog(0x7776),
		]);
		expect(removedLogAnnouncements).to.deep.equal([new MockLog(0x7777)]);
	});

	it("removes multiple logs in reverse order for same block", async () => {
		const removedBlock = new MockBlock(0x7777);
		// NOTE: log index sorting is handled on new block processing but not validated during removal process so out-of-order indexes are only possible by manually creating history
		const oldLogHistory = ImmutableList<Log>([
			new MockLog(0x7775),
			new MockLog(0x7776),
			new MockLog(0x7777, 0x1),
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x2),
		]);

		const newLogHistory = await reconcileLogHistoryWithRemovedBlock(oldLogHistory, removedBlock, onLogRemoved);

		expect(newLogHistory.toJS()).to.deep.equal([
			new MockLog(0x7775),
			new MockLog(0x7776),
		]);
		expect(removedLogAnnouncements).to.deep.equal([
			new MockLog(0x7777, 0x2),
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x1),
		]);
	});

	it("throws if removed block is not at head", async () => {
		const removedBlock = new MockBlock(0x7776);
		const oldLogHistory = ImmutableList<Log>([
			new MockLog(0x7775),
			new MockLog(0x7776),
			new MockLog(0x7777),
		]);

		const newLogHistoryPromise = reconcileLogHistoryWithRemovedBlock(oldLogHistory, removedBlock, onLogRemoved);

		await expect(newLogHistoryPromise).to.eventually.rejectedWith(Error, "found logs for removed block not at head of log history");
		expect(removedLogAnnouncements).to.be.empty;
	});

	it("removes head logs for block before throwing upon finding nonhead logs for block", async () => {
		const removedBlock = new MockBlock(0x7777);
		const oldLogHistory = ImmutableList<Log>([
			new MockLog(0x7775),
			new MockLog(0x7777),
			new MockLog(0x7776),
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x1),
		]);

		const newLogHistoryPromise = reconcileLogHistoryWithRemovedBlock(oldLogHistory, removedBlock, onLogRemoved);

		await expect(newLogHistoryPromise).to.eventually.rejectedWith(Error, "found logs for removed block not at head of log history");
		expect(removedLogAnnouncements).to.deep.equal([
			new MockLog(0x7777, 0x1),
			new MockLog(0x7777, 0x0),
		]);
	});
});

describe("reconcileBlocksAndLogs", async () => {
	let logAddedAnnouncements: Log[];
	let logRemovedAnnouncements: Log[];
	const onLogAdded = async (log: Log) => { await delay(0); logAddedAnnouncements.push(log); };
	const onLogRemoved = async (log: Log) => { await delay(0); logRemovedAnnouncements.push(log); };

	beforeEach(() => {
		logAddedAnnouncements = [];
		logRemovedAnnouncements = [];
	});

	it("calls logs callback and returns correct history when first block with logs is added", async () => {
		const getBlockByHash = getBlockByHashFactory();
		const getLogs = getLogsFactory(1);
		const oldHistory = null;
		const newBlock = new MockBlock(0x7777);

		const newHistory = await reconcileBlocksAndLogs(getBlockByHash, getLogs, oldHistory, newBlock, onLogAdded, onLogRemoved);

		expect(newHistory.blockHistory.toJS()).to.deep.equal([new MockBlock(0x7777)]);
		expect(newHistory.logHistory.toJS()).to.deep.equal([new MockLog(0x7777)]);
		expect(logAddedAnnouncements).to.deep.equal([new MockLog(0x7777)]);
		expect(logRemovedAnnouncements).to.be.empty;
	});

	it("calls log callback and returns correct history when nth block with logs is added", async () => {
		const getBlockByHash = getBlockByHashFactory();
		const getLogs = getLogsFactory(2);
		const oldHistory = {
			blockHistory: ImmutableList<Block>([
				new MockBlock(0x7777),
				new MockBlock(0x7778),
			]),
			logHistory: ImmutableList<Log>([
				new MockLog(0x7777, 0x0),
				new MockLog(0x7777, 0x1),
				new MockLog(0x7778, 0x0),
				new MockLog(0x7778, 0x1),
			]),
		}
		const newBlock = new MockBlock(0x7779);

		const newHistory = await reconcileBlocksAndLogs(getBlockByHash, getLogs, oldHistory, newBlock, onLogAdded, onLogRemoved);

		expect(newHistory.blockHistory.toJS()).to.deep.equal([
			new MockBlock(0x7777),
			new MockBlock(0x7778),
			new MockBlock(0x7779),
		]);
		expect(newHistory.logHistory.toJS()).to.deep.equal([
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x1),
			new MockLog(0x7778, 0x0),
			new MockLog(0x7778, 0x1),
			new MockLog(0x7779, 0x0),
			new MockLog(0x7779, 0x1),
		]);
		expect(logAddedAnnouncements).to.deep.equal([
			new MockLog(0x7779, 0x0),
			new MockLog(0x7779, 0x1),
		]);
		expect(logRemovedAnnouncements).to.be.empty;
	});

	it("calls removal callback when a re-org occurs", async () => {
		const getBlockByHash = getBlockByHashFactory();
		const getLogs = getLogsFactory(3);
		const oldHistory = {
			blockHistory: ImmutableList<Block>([
				new MockBlock(0x7777, "AAAA"),
				new MockBlock(0x7778, "AAAA"),
			]),
			logHistory: ImmutableList<Log>([
				new MockLog(0x7777, 0x0),
				new MockLog(0x7777, 0x1),
				new MockLog(0x7778, 0x0),
				new MockLog(0x7778, 0x1),
			]),
		}
		const newBlock = new MockBlock(0x7778, "BBBB", "AAAA");

		const newHistory = await reconcileBlocksAndLogs(getBlockByHash, getLogs, oldHistory, newBlock, onLogAdded, onLogRemoved);
		expect(newHistory.blockHistory.toJS()).to.deep.equal([
			new MockBlock(0x7777, "AAAA"),
			new MockBlock(0x7778, "BBBB", "AAAA"),
		]);
		expect(newHistory.logHistory.toJS()).to.deep.equal([
			new MockLog(0x7777, 0x0),
			new MockLog(0x7777, 0x1),
			new MockLog(0x7778, 0x0),
			new MockLog(0x7778, 0x1),
			new MockLog(0x7778, 0x2),
		]);
		expect(logAddedAnnouncements).to.deep.equal([
			new MockLog(0x7778, 0x0),
			new MockLog(0x7778, 0x1),
			new MockLog(0x7778, 0x2),
		]);
		expect(logRemovedAnnouncements).to.deep.equal([
			new MockLog(0x7778, 0x1),
			new MockLog(0x7778, 0x0),
		]);
	});
});
