// Application-wide constants for Zenon Explorer

export const CONFIG = {
  NODE: {
    DEFAULT_URL: process.env.NEXT_PUBLIC_ZENON_NODE_URL || 'wss://my.hc1node.com:35998',
    DEFAULT_NODES: [
      { url: 'wss://my.hc1node.com:35998', name: 'HC1 Node', isDefault: true },
      { url: 'wss://node.zenonhub.io:35998', name: 'ZenonHub', isDefault: true },
      { url: 'wss://node.atsocy.com:35998', name: 'Atsocy', isDefault: true },
    ] as const,
    RECONNECT_MAX_ATTEMPTS: 5,
    RECONNECT_DELAY_MS: 1000,
    REQUEST_TIMEOUT_MS: 30000,
  },
  PAGINATION: {
    DEFAULT_SIZE: 10,
    SIZE_OPTIONS: [10, 25, 50, 100] as const,
  },
  DASHBOARD: {
    MOMENTUMS_COUNT: 8,
    TRANSACTIONS_COUNT: 8,
    REFRESH_INTERVAL_MS: 10000,
  },
  CACHE: {
    MOMENTUM_TTL_MS: 5 * 60 * 1000,      // 5 minutes - immutable once confirmed
    ACCOUNT_BLOCK_TTL_MS: 5 * 60 * 1000, // 5 minutes - immutable once confirmed
    TOKEN_TTL_MS: 5 * 60 * 1000,         // 5 minutes - token info rarely changes
    ACCOUNT_INFO_TTL_MS: 30 * 1000,      // 30 seconds - balances can change
    LIST_TTL_MS: 10 * 1000,              // 10 seconds - lists change frequently
    PILLAR_TTL_MS: 60 * 1000,            // 1 minute - pillar info updates periodically
  },
};

// Block type mapping for transaction types
export const BLOCK_TYPES: Record<number, string> = {
  1: 'GENESIS RECEIVE',
  2: 'USER SEND',
  3: 'USER RECEIVE',
  4: 'CONTRACT SEND',
  5: 'CONTRACT RECEIVE',
};

// Token standard addresses for ZNN and QSR
export const TOKEN_STANDARDS = {
  ZNN: 'zts1znnxxxxxxxxxxxxx9z4ulx',
  QSR: 'zts1qsrxxxxxxxxxxxxxmrhjll',
} as const;

// Display names for tokens
export const TOKEN_NAMES: Record<string, string> = {
  [TOKEN_STANDARDS.ZNN]: 'ZNN',
  [TOKEN_STANDARDS.QSR]: 'QSR',
};

// Bridge Orchestrator Configuration
export const BRIDGE_CONFIG = {
  ORCHESTRATOR_PORT: 55000,
  REFRESH_INTERVAL_MS: 30000,
  REQUEST_TIMEOUT_MS: 5000,
  MIN_ONLINE_FOR_BRIDGE: 16,
} as const;

// State mapping for orchestrator status
export const ORCHESTRATOR_STATE_MAP: Record<number, string> = {
  0: 'LiveState',
  1: 'KeyGenState',
  2: 'HaltedState',
  3: 'EmergencyState',
  4: 'ReSignState',
};

// States considered "online"
export const ORCHESTRATOR_ONLINE_STATES = [0, 1];

// Orchestrator pillar mapping - IP to pillar info with producer addresses
export const PILLAR_MAPPING: Record<string, { name: string; pubkey: string; producerAddress: string }> = {
  '5.161.213.40': { name: 'Anvil', pubkey: 'Cdq18YwdIT21VcOOl3uczUl/W+RGCqi9CgFIf4CLr8g=', producerAddress: 'z1qr44r4fxhs33v7jusreurda7n60xy4gqvg8j9u' },
  '51.222.12.113': { name: 'Zeno', pubkey: 'HxX/6MM7jcjqHAyESWHvLVN3KLWjt6GKgRAgTY9CUqc=', producerAddress: 'z1qz855vhcq70zg22h035kuxk7htummvt5yc98yh' },
  '172.245.233.178': { name: '0x3639.com', pubkey: 'LbNpGLiwr9ZVAx5Rzbq/dMI7ijkSZf6nMI7Zlof8j0k=', producerAddress: 'z1qpqn7uqlqyqeuf3z5sudvk2tgg2ghwa9pyq5ny' },
  '161.97.167.129': { name: '12N11', pubkey: 'NbxBOar2Q8pPYa2ABIap2aOCzpZO2MZuXwoLNrk3bdc=', producerAddress: 'z1qqu775znqmk8qlyqt36t6qnjvulqgmzt0vnlga' },
  '23.95.79.26': { name: 'NoMLabz.org', pubkey: 'WzKhvWcekYTdRyAGrB4bW3fbj/Zvk1aSQNUkxVst700=', producerAddress: 'z1qqjx9zdunxxuvkqwjfkac0jvnrzwu45ey8lhyl' },
  '159.69.183.154': { name: 'ZenonORG3', pubkey: 'bLgOQXP9qEDm0snI/NFAO1kVzE17YHdzHxMmoPQawQU=', producerAddress: 'z1qpuxlt357nsy6kuvqhvx2vdv0lfyw576a005me' },
  '49.13.221.207': { name: 'ZenonORG2', pubkey: 'dpJTNz+J+t+61CqNmqBCqN3jHhdiMbXqxAd6/eNlVmo=', producerAddress: 'z1qzfq7urv5ykn9dnny9pe0z7dkssxqjn97wrv42' },
  '62.171.148.56': { name: 'StakeServe', pubkey: 'eP5mlLqa47bA5R79hh2ds/R5sOPa8nhWcDQN5w4BsEY=', producerAddress: 'z1qqm9ld4vgx6ntv96qf5gyxqenzune7n3aadg4h' },
  '51.89.155.26': { name: 'ElderZ', pubkey: 'ePSgBL7qaYNU5OYpmqmPm1ayI6BNIt0XhH0v2Yh220g=', producerAddress: 'z1qr5kzrlkw8w7ddfx63rrv6a46n03kncpmvhct8' },
  '51.222.12.145': { name: 'MoonBaZe', pubkey: 'fvGMCT2U5wAV9clv2LBpTMdSKHqcUiqI3NuglmWcZkk=', producerAddress: 'z1qr68wfxwj40p24ujuhvclzxh3yksdnqvv9l9m3' },
  '34.125.216.244': { name: 'SultanOfStaking', pubkey: 'gwXonyuXWFRnz4lryObtUZKeOiq31Nh53GLRMDlha2M=', producerAddress: 'z1qrs6u4vmgxkgqcamq7hlfqm9mzad45u66vntfx' },
  '93.127.202.74': { name: 'Nexus', pubkey: 'h1vpPABWPgtu0BE886LqRESoQ/WkokPQNO6JiyoVEsk=', producerAddress: 'z1qpz5mjcyl8kftfk68l7x5afe663sh6xalts8uk' },
  '23.95.72.54': { name: 'DeeZNNutz.com', pubkey: 'i0MkFAj+f4FipCHu/L4Ee3g23pkRR7eoOPe1VRH2S4Y=', producerAddress: 'z1qr9dd6qmzwr8sazns24lna8zz5e8208nqq2hcx' },
  '51.79.147.224': { name: 'tapwoot', pubkey: 'iyyltT42L6pZgS0B7RQOSl5p26FsMSlt4V76ZI9+kcU=', producerAddress: 'z1qz7rl42ytj7j5kyqn6dw38hds3pwru38y3p7r0' },
  '51.83.187.145': { name: 'WotGasFees', pubkey: 'k0VjkxdFXz3tgEszXcAvXInYUDRMzVPcUhyaVGREriI=', producerAddress: 'z1qr9yer2qlhthg0c5jh5j6pzcc8c8ta8tdljk57' },
  '109.104.152.53': { name: 'Stark', pubkey: 'nxPtMkX6BJn/NSOV9qTV/T4yXQ3b0QTPaySla38L8go=', producerAddress: 'z1qzdwhpqwtz5yhrp7nuk7cl6zhjp3ywn57l3l9v' },
  '89.145.164.212': { name: 'Megalith', pubkey: 'p+bD1q4OniBmikRX2UscBFXV/mnOz/ILAoH5Kd6hRNA=', producerAddress: 'z1qrztagl9rukq3ltdflnvg4zrvpfp84mydfejk9' },
  '51.79.147.166': { name: 'Time', pubkey: 't8el+WTyESTS4Lke/+5hQX8cjnnoqjYM9uVBYJyxfUo=', producerAddress: 'z1qqrjdnzf2tuvxnp7dn54l7t6k6u60k5m5nknvg' },
  '178.18.251.111': { name: 'Mariposa01', pubkey: 'vm37WOlgoQc2yCgVX2IUj5xCfOgObj5Za7xi9ZRpGq8=', producerAddress: 'z1qpza2k4fldpwsjrw0ae27ywnfnsc352sfed2e0' },
  '188.245.58.57': { name: 'ZenonORG', pubkey: 'wePlF1o2eLtxFvWgslazIhjGhlRI4lVQOduUr3v37W4=', producerAddress: 'z1qpfs9pef5sht6e7jzc4utmnnmt9gpy0e7tpgs0' },
};
