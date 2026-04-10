/**
 * RTC token builder compatible with `agora-access-token` (006) — pure JS
 * (crypto-js + crc-32 + cuint + buffer). No Node `crypto`, no Nitro/native crypto.
 */
import { Buffer } from "buffer";
import CryptoJS from "crypto-js";
import * as CRC32 from "crc-32";
import { UINT32 } from "cuint";
import {
  NEXT_PUBLIC_AGORA_APP_ID,
  NEXT_PUBLIC_AGORA_APP_CERTIFICATE,
} from "@env";

const TOKEN_VERSION = "006";

const PRIVILEGES = {
  kJoinChannel: 1,
  kPublishAudioStream: 2,
  kPublishVideoStream: 3,
  kPublishDataStream: 4,
} as const;

const RTC_ROLE_PUBLISHER = 1;

function encodeHMac(appCertificate: string, message: Buffer): Buffer {
  const key = CryptoJS.enc.Utf8.parse(appCertificate);
  const msg = CryptoJS.enc.Latin1.parse(message.toString("binary"));
  const sig = CryptoJS.HmacSHA256(msg, key);
  return Buffer.from(sig.toString(CryptoJS.enc.Hex), "hex");
}

type ByteBufType = {
  buffer: Buffer;
  position: number;
  pack: () => Buffer;
  putUint16: (v: number) => ByteBufType;
  putUint32: (v: number) => ByteBufType;
  putBytes: (bytes: Buffer) => ByteBufType;
  putString: (str: string | Buffer) => ByteBufType;
  putTreeMapUInt32: (map: Record<number, number>) => ByteBufType;
};

function ByteBuf(): ByteBufType {
  const self = {
    buffer: Buffer.alloc(1024) as Buffer,
    position: 0,
  } as ByteBufType;
  self.buffer.fill(0);
  self.pack = () => {
    const out = Buffer.alloc(self.position);
    self.buffer.copy(out, 0, 0, out.length);
    return out;
  };
  self.putUint16 = (v: number) => {
    self.buffer.writeUInt16LE(v, self.position);
    self.position += 2;
    return self;
  };
  self.putUint32 = (v: number) => {
    self.buffer.writeUInt32LE(v, self.position);
    self.position += 4;
    return self;
  };
  self.putBytes = (bytes: Buffer) => {
    self.putUint16(bytes.length);
    bytes.copy(self.buffer, self.position);
    self.position += bytes.length;
    return self;
  };
  self.putString = (str: string | Buffer) => {
    const bytes = Buffer.isBuffer(str)
      ? str
      : Buffer.from(str, "utf8");
    return self.putBytes(bytes);
  };
  self.putTreeMapUInt32 = (map: Record<number, number>) => {
    const keys = Object.keys(map ?? {});
    self.putUint16(keys.length);
    for (const k of keys) {
      self.putUint16(Number(k));
      self.putUint32(map[Number(k)] ?? 0);
    }
    return self;
  };
  return self;
}

function packMessage(salt: number, ts: number, messages: Record<number, number>) {
  return ByteBuf().putUint32(salt).putUint32(ts).putTreeMapUInt32(messages).pack();
}

function packAccessTokenContent(opts: {
  signature: Buffer;
  crc_channel: number;
  crc_uid: number;
  m: Buffer;
}) {
  return ByteBuf()
    .putString(opts.signature)
    .putUint32(opts.crc_channel)
    .putUint32(opts.crc_uid)
    .putString(opts.m)
    .pack();
}

function buildAccessToken(
  appIdStr: string,
  appCertificate: string,
  channelName: string,
  uid: number | string,
  privilegeExpiredTs: number,
  role: number,
): string {
  const salt = Math.floor(Math.random() * 0xffffffff);
  const ts = Math.floor(Date.now() / 1000) + 24 * 3600;
  const uidStr = uid === 0 ? "" : `${uid}`;
  const messages: Record<number, number> = {};
  messages[PRIVILEGES.kJoinChannel] = privilegeExpiredTs;
  if (
    role === 0 ||
    role === RTC_ROLE_PUBLISHER ||
    role === 101
  ) {
    messages[PRIVILEGES.kPublishAudioStream] = privilegeExpiredTs;
    messages[PRIVILEGES.kPublishVideoStream] = privilegeExpiredTs;
    messages[PRIVILEGES.kPublishDataStream] = privilegeExpiredTs;
  }

  const m = packMessage(salt, ts, messages);
  const toSign = Buffer.concat([
    Buffer.from(appIdStr, "utf8"),
    Buffer.from(channelName, "utf8"),
    Buffer.from(uidStr, "utf8"),
    m,
  ]);
  const signature = encodeHMac(appCertificate, toSign);
  const crcChannel = UINT32(CRC32.str(channelName)).and(UINT32(0xffffffff)).toNumber();
  const crcUid = UINT32(CRC32.str(uidStr)).and(UINT32(0xffffffff)).toNumber();
  const content = packAccessTokenContent({
    signature,
    crc_channel: crcChannel,
    crc_uid: crcUid,
    m,
  });
  return TOKEN_VERSION + appIdStr + content.toString("base64");
}

const appId = NEXT_PUBLIC_AGORA_APP_ID ?? "";
const appCertificate = NEXT_PUBLIC_AGORA_APP_CERTIFICATE ?? "";
const expirationTimeInSeconds = 3600;

export const generateAgoraTokenForCall = (
  channelName: string,
  _userId: number,
): string => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpirationTimestamp =
    currentTimestamp + expirationTimeInSeconds;

  return buildAccessToken(
    appId,
    appCertificate,
    channelName,
    0,
    privilegeExpirationTimestamp,
    RTC_ROLE_PUBLISHER,
  );
};
