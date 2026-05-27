const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "guest"],
    },
    preferredColor: {
      type: String,
      default: null,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = String(ret._id);
    ret.created_at = ret.createdAt ? ret.createdAt.toISOString() : null;
    delete ret._id;
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.passwordHash;
    return ret;
  },
});

const User = model("User", userSchema);

function toPublicUser(user) {
  if (!user) return null;
  const obj = typeof user.toObject === "function" ? user.toObject() : user;
  delete obj.passwordHash;
  const createdAt = obj.createdAt ?? obj.created_at ?? null;
  return {
    id: String(obj._id ?? obj.id),
    name: obj.name,
    email: obj.email,
    role: obj.role,
    preferredColor: obj.preferredColor || null,
    isGuest: !!obj.isGuest,
    created_at: createdAt ? new Date(createdAt).toISOString() : null,
  };
}

async function createUser({ name, email, passwordHash, role = "user", preferredColor = null, isGuest = false }) {
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    preferredColor,
    isGuest,
  });
  return toPublicUser(user);
}

async function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase() }).select("+passwordHash").lean(false);
}

async function findById(id) {
  const user = await User.findById(id).lean(false);
  return toPublicUser(user);
}

async function updatePreferredColor(id, color) {
  await User.updateOne({ _id: id }, { $set: { preferredColor: color } });
}

module.exports = { User, createUser, findByEmail, findById, toPublicUser, updatePreferredColor };
