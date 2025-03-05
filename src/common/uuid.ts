import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

export const getUUID = () => {
  return parseInt(
    crypto.createHash("md5").update(uuidv4()).digest("hex").substring(0, 12),
    16
  );
};
