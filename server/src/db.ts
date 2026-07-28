import mongoose from 'mongoose';

// MongoDB persistence with a graceful in-memory fallback: if no MongoDB is
// reachable the server still runs (auth + state survive until restart) and
// logs loudly so nobody mistakes it for durable storage.

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Repos {
  backend: 'mongodb' | 'memory';
  users: {
    findByEmail(email: string): Promise<UserRecord | null>;
    findById(id: string): Promise<UserRecord | null>;
    create(data: { name: string; email: string; passwordHash: string }): Promise<UserRecord>;
  };
  state: {
    get(userId: string): Promise<unknown | null>;
    set(userId: string, state: unknown): Promise<void>;
  };
  /** Long-term per-user memory shared by the typed and spoken chat (memory.ts). */
  context: {
    get(userId: string): Promise<unknown | null>;
    set(userId: string, context: unknown): Promise<void>;
    clear(userId: string): Promise<void>;
  };
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

const stateSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    state: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

const contextSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    context: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

function toRecord(doc: any): UserRecord {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

function mongoRepos(): Repos {
  const User = mongoose.models.User ?? mongoose.model('User', userSchema);
  const UserState = mongoose.models.UserState ?? mongoose.model('UserState', stateSchema);
  const UserContextDoc = mongoose.models.UserContext ?? mongoose.model('UserContext', contextSchema);
  return {
    backend: 'mongodb',
    users: {
      async findByEmail(email) {
        const d = await User.findOne({ email: email.toLowerCase().trim() }).lean();
        return d ? toRecord(d) : null;
      },
      async findById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        const d = await User.findById(id).lean();
        return d ? toRecord(d) : null;
      },
      async create(data) {
        const d = await User.create(data);
        return toRecord(d);
      },
    },
    state: {
      async get(userId) {
        const d = await UserState.findOne({ userId }).lean();
        return (d as any)?.state ?? null;
      },
      async set(userId, state) {
        await UserState.updateOne({ userId }, { $set: { state } }, { upsert: true });
      },
    },
    context: {
      async get(userId) {
        const d = await UserContextDoc.findOne({ userId }).lean();
        return (d as any)?.context ?? null;
      },
      async set(userId, context) {
        await UserContextDoc.updateOne({ userId }, { $set: { context } }, { upsert: true });
      },
      async clear(userId) {
        await UserContextDoc.deleteOne({ userId });
      },
    },
  };
}

function memoryRepos(): Repos {
  const users = new Map<string, UserRecord>(); // by id
  const byEmail = new Map<string, string>();
  const states = new Map<string, unknown>();
  const contexts = new Map<string, unknown>();
  let seq = 0;
  return {
    backend: 'memory',
    users: {
      async findByEmail(email) {
        const id = byEmail.get(email.toLowerCase().trim());
        return id ? users.get(id) ?? null : null;
      },
      async findById(id) {
        return users.get(id) ?? null;
      },
      async create(data) {
        const id = `mem_${++seq}_${Math.random().toString(36).slice(2, 8)}`;
        const rec: UserRecord = {
          id, name: data.name, email: data.email.toLowerCase().trim(),
          passwordHash: data.passwordHash, createdAt: new Date().toISOString(),
        };
        users.set(id, rec);
        byEmail.set(rec.email, id);
        return rec;
      },
    },
    state: {
      async get(userId) { return states.get(userId) ?? null; },
      async set(userId, state) { states.set(userId, state); },
    },
    context: {
      async get(userId) { return contexts.get(userId) ?? null; },
      async set(userId, context) { contexts.set(userId, context); },
      async clear(userId) { contexts.delete(userId); },
    },
  };
}

let repos: Repos | null = null;

export async function initDb(): Promise<Repos> {
  if (repos) return repos;
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/northr';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    repos = mongoRepos();
    console.log(`[db] connected to MongoDB at ${uri.replace(/\/\/[^@]*@/, '//***@')}`);
  } catch (err: any) {
    console.warn('!!'.repeat(35));
    console.warn(`[db] MongoDB unreachable (${err.message}).`);
    console.warn('[db] FALLING BACK TO IN-MEMORY STORAGE — accounts and saved state are LOST on restart.');
    console.warn('[db] Start MongoDB or set MONGODB_URI, then restart the server.');
    console.warn('!!'.repeat(35));
    repos = memoryRepos();
  }
  return repos;
}

export function getRepos(): Repos {
  if (!repos) throw new Error('initDb() must be awaited before use');
  return repos;
}
