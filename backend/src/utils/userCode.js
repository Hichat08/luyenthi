import User from "../models/User.js";

const USER_CODE_MIN = 10000000;
const USER_CODE_MAX = 99999999;
const MAX_GENERATION_ATTEMPTS = 20;

const generateRandomUserCode = () =>
  `${Math.floor(Math.random() * (USER_CODE_MAX - USER_CODE_MIN + 1)) + USER_CODE_MIN}`;

export const createUniqueUserCode = async () => {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const userCode = generateRandomUserCode();
    const exists = await User.exists({ userCode });

    if (!exists) {
      return userCode;
    }
  }

  throw new Error("Không thể tạo userCode duy nhất.");
};

export const ensureUserCode = async (user) => {
  if (!user || user.userCode) {
    return user;
  }

  user.userCode = await createUniqueUserCode();
  await user.save();

  return user;
};
