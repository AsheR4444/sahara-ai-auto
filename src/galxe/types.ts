// Базовые типы
export type WithTypename<T extends string> = {
  __typename: T
}

export type Connection<T, TName extends string> = {
  list: T[]
} & WithTypename<TName>

export type Address = {
  id: string
  avatar: string
} & WithTypename<"Address">

// Общие типы для кампаний
export type Space = {
  id: string
  alias: string
  isAdmin: boolean
  name: string
  info: string
  thumbnail: string
  status: string
  links: string
  isVerified: boolean
  discordGuildID: string
  followersCount: number
  nftCores: Connection<never, "NFTCoreConnection">
  isFollowing: boolean
  categories: string[]
} & WithTypename<"Space">

export type TokenReward = {
  userTokenAmount: string
  tokenAddress: string
  depositedTokenAmount: string
  tokenRewardId: null
  tokenDecimal: string
  tokenLogo: string
  tokenSymbol: string
} & WithTypename<"TokenReward">

export type ParticipationRecord = {
  address: Address
} & WithTypename<"ParticipationRecord">

export type CampaignParticipant = {
  participants: Connection<ParticipationRecord, "ParticipantsConnection">
  participantsCount: number
  bountyWinners: Connection<never, "ParticipantsConnection">
  bountyWinnersCount: number
} & WithTypename<"CampaignParticipant">

// Типы для наград и условий
export type VisitLinkCredMetadata = {
  link: string
} & WithTypename<"VisitLinkCredMetadata">

export type CredMetadata = {
  visitLink: VisitLinkCredMetadata | null
  twitter: null
} & WithTypename<"CredMetadata">

export type CredCommonInfo = {
  participateEndTime: number
  modificationInfo: string
} & WithTypename<"CredCommonInfo">

type CredType =
  | "TWITTER_FOLLOW"
  | "TWITTER_RT"
  | "TWITTER_LIKE"
  | "TWITTER_QUOTE"
  | "VISIT_LINK"
  | "QUIZ"
  | "SURVEY"
  | "SPACE_USERS"
  | "WATCH_YOUTUBE"
  | "CSV"

export type Cred = {
  id: string
  name: string
  type: CredType
  credType: string
  credSource: string
  dimensionConfig: string
  referenceLink: string
  description: string
  lastUpdate: number
  lastSync: number
  chain: string
  eligible: number
  metadata: CredMetadata
  commonInfo: CredCommonInfo
  syncStatus: string
  credContractNFTHolder: null
  subgraph: null
  value: null
} & WithTypename<"Cred">

export type ExprEntity = {
  cred: Cred
  attrs: unknown[]
  attrFormula: null
  eligible: boolean
  eligibleAddress: null
} & WithTypename<"ExprEntity">

export type RewardType = "LOYALTYPOINTS"

export type ExprReward = {
  arithmetics: unknown[]
  arithmeticFormula: string
  rewardType: RewardType
  rewardCount: number
  rewardVal: string
} & WithTypename<"ExprReward">

export type RewardConfig = {
  id: string
  conditions: ExprEntity[]
  conditionalFormula: string
  description: string
  rewards: ExprReward[]
  eligible: boolean
  rewardAttrVals: unknown[]
} & WithTypename<"RewardConfig">

export type TaskConfig = {
  participateCondition: null
  rewardConfigs: RewardConfig[]
  referralConfig: null
} & WithTypename<"TaskConfig">

export type BaseCampaign = {
  id: string
  thumbnail: string
  isSequencial: boolean
  childrenCampaigns: never[]
} & WithTypename<"Campaign">

export type WhitelistInfo = {
  address: string
  maxCount: number
  usedCount: number
  claimedLoyaltyPoints: number
  currentPeriodClaimedLoyaltyPoints: number
  currentPeriodMaxLoyaltyPoints: number
} & WithTypename<"WhitelistAddress">

export type CredentialGroup = {
  id: string
  description: string
  credentials: Cred[]
  conditionRelation: string
  conditions: {
    expression: string
    eligible: boolean
  }[]
  rewards: {
    expression: string
    eligible: boolean
    rewardCount: number
    rewardType: string
  }[]
  rewardAttrVals: {
    attrName: string
    attrTitle: string
    attrVal: string
  }[]
  claimedLoyaltyPoints: number
} & WithTypename<"CredentialGroup">

export type WhitelistSubgraph = {
  query: string
  endpoint: string
  expression: string
  variable: string
} & WithTypename<"WhitelistSubgraph">

export type CampaignResponse = {
  data: {
    campaign: CampaignType & WithTypename<"Campaign">
  }
}

export type CampaignType = {
  id: string
  space: Space
  parentCampaign: BaseCampaign
  coHostSpaces: unknown[]
  bannerUrl: string
  thumbnail: string
  rewardName: string
  type: "Parent"
  gamification: {
    id: string
    type: "Points" | "Oat" | "PointsMysteryBox" | "Drop" | "Bounty" | "DiscordRole" | "Token"
    forgeConfig: null
    nfts: unknown[]
  } & WithTypename<"Gamification">
  numberID: number
  chain: string
  spaceStation: null
  name: string
  rewardType: RewardType
  nftHolderSnapshot: {
    holderSnapshotBlock: number
  } & WithTypename<"CampaignNFTHolderSnapshot">
  rewardInfo: {
    discordRole: null
    premint: null
    loyaltyPoints: {
      points: number
    } & WithTypename<"LoyaltyPointsRewardInfo">
    loyaltyPointsMysteryBox: null
  } & WithTypename<"RewardInfo">
  participants: CampaignParticipant
  inWatchList: boolean
  cap: number
  info: string
  useCred: boolean
  smartbalancePreCheck: string
  smartbalanceDeposited: boolean
  formula: string
  status: string
  seoImage: string
  creator: string
  tags: string[]
  gasType: string
  isPrivate: boolean
  createdAt: string
  requirementInfo: string
  description: string
  enableWhitelist: boolean
  startTime: number
  endTime: null
  requireEmail: boolean
  requireUsername: boolean
  blacklistCountryCodes: string
  whitelistRegions: string
  distributionType: string
  claimEndTime: null
  loyaltyPoints: number
  tokenRewardContract: null
  tokenReward: TokenReward
  whitelistInfo: WhitelistInfo
  whitelistSubgraph: WhitelistSubgraph
  credentialGroups: CredentialGroup[]
  taskConfig: TaskConfig
  referralCode: null
  recurringType: CampaignRecurringType
  latestRecurringTime: number
  nftTemplates: unknown[]
  userParticipants: Connection<never, "ParticipationConnection">
  isBookmarked: boolean
  claimedLoyaltyPoints: number
  isSequencial: boolean
  numNFTMinted: number
  childrenCampaigns: null
}

type CampaignRecurringType = "DAILY" | string

export type SignInResponse = {
  data: {
    signin: string
  }
  errors?: Array<{
    message: string
    path: Array<string | number>
    extensions: Record<string, unknown>
  }>
}

export type IsUsernameExistResponse = {
  data: {
    userNameExists: {
      exists: boolean
      errorMessage: string
    } & WithTypename<"UserNameExistsResult">
  }
}

export type CreateNewAccountResponse = {
  data: {
    createNewAccount: string
  }
}

export type IsAccountExistResponse = {
  data: {
    galxeIdExist: boolean
  }
}

export type UserLevel = {
  level: {
    name: string
    logo: string
    minExp: number
    maxExp: number
    value: number
  } & WithTypename<"Level">
  exp: number
  gold: number
} & WithTypename<"UserLevel">

export type AccountInfo = {
  id: string
  username: string
  avatar: string
  address: string
  evmAddressSecondary: null
  userLevel: UserLevel
  hasEmail: boolean
  solanaAddress: string
  aptosAddress: string
  seiAddress: string
  injectiveAddress: string
  flowAddress: string
  starknetAddress: string
  bitcoinAddress: string
  suiAddress: string
  stacksAddress: string
  azeroAddress: string
  archwayAddress: string
  bitcoinSignetAddress: string
  xrplAddress: string
  algorandAddress: string
  tonAddress: string
  hasEvmAddress: boolean
  hasSolanaAddress: boolean
  hasAptosAddress: boolean
  hasInjectiveAddress: boolean
  hasFlowAddress: boolean
  hasStarknetAddress: boolean
  hasBitcoinAddress: boolean
  hasSuiAddress: boolean
  hasStacksAddress: boolean
  hasAzeroAddress: boolean
  hasArchwayAddress: boolean
  hasBitcoinSignetAddress: boolean
  hasXrplAddress: boolean
  hasAlgorandAddress: boolean
  hasTonAddress: boolean
  hasTwitter: boolean
  hasGithub: boolean
  hasDiscord: boolean
  hasTelegram: boolean
  hasWorldcoin: boolean
  displayEmail: boolean
  displayTwitter: boolean
  displayGithub: boolean
  displayDiscord: boolean
  displayTelegram: boolean
  displayWorldcoin: boolean
  displayNamePref: string
  email: string
  twitterUserID: string
  twitterUserName: string
  githubUserID: string
  githubUserName: string
  discordUserID: string
  discordUserName: string
  telegramUserID: string
  telegramUserName: string
  worldcoinID: string
  enableEmailSubs: boolean
  subscriptions: null
  isWhitelisted: boolean
  isInvited: boolean
  isAdmin: boolean
  accessToken: string
} & WithTypename<"Address">

export type AccountInfoResponse = {
  data: {
    addressInfo: AccountInfo
  }
}

export type CheckTwitterAccountResponseTypes = {
  data: {
    checkTwitterAccount: {
      address: string
      twitterUserID: string
      twitterUserName: string
    }
  }
}
