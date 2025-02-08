import { faker } from "@faker-js/faker"
import axios, { AxiosProxyConfig, AxiosRequestConfig } from "axios"
import UserAgent from "user-agents"
import uuid4 from "uuid4"

import { Client } from "@/eth-async/client"
import { AccountInfoResponse, CampaignResponse, CampaignType, CreateNewAccountResponse, Cred, IsAccountExistResponse, IsUsernameExistResponse, SignInResponse } from "@/galxe/types"
import { GlobalClient } from "@/GlobalClient"
import { getProxyConfigAxios, getRandomNumber, logger, randomStringForEntropy } from "@/helpers"

import { solverGeeTestCaptcha } from "./captcha"

import "dotenv/config"

class Galxe {
  client: GlobalClient
  evmClient: Client
  headers: Required<AxiosRequestConfig>["headers"]
  token: string | null
  proxy: AxiosProxyConfig | null
  userAgent: string

  constructor(client: GlobalClient) {
    this.token = null
    this.evmClient = client.evmClient
    this.proxy = client.proxy ? getProxyConfigAxios(client.proxy) : null
    this.userAgent = new UserAgent({
      deviceCategory: "desktop",
    }).toString()

    this.client = client
    this.headers = {
      "Content-Type": "application/json",
      "Request-Id": uuid4(),
      "User-Agent": this.userAgent,
    }
  }

  static getGamificationType(campaign: CampaignType) {
    if (campaign.gamification === undefined || null) return null

    return campaign.gamification.type
  }

  private setAuthToken(token: string) {
    this.token = token

    this.headers = {
      ...this.headers,
      authorization: token,
    }
  }

  private fakeUsername() {
    let name: string

    do {
      name = faker.internet.username()
    } while (name.length < 4)

    return name
  }

  private getMessage() {
    const expDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, -1) + "Z"
    const issDate = new Date(Date.now()).toISOString().slice(0, -1) + "Z"

    return `app.galxe.com wants you to sign in with your Ethereum account:\n${this.evmClient.signer.address}

Sign in with Ethereum to the app.

URI: https://app.galxe.com
Version: 1
Chain ID: 1625
Nonce: ${randomStringForEntropy(96)}
Issued At: ${issDate}
Expiration Time: ${expDate}`
  }

  private async request<T>(data: unknown) {
    const response = await axios.post<T>(
      "https://graphigo.prd.galaxy.eco/query",
      data,
      {
        headers: this.headers,
        proxy: this.proxy || false,
      },
    )

    return response.data
  }

  private async isUsernameExist(username: string) {
    const response = await this.request<IsUsernameExistResponse>({
      operationName: "UserNameExists",
      variables: {
        username,
      },
      query: "query UserNameExists($username: String!) {\n  userNameExists(username: $username) {\n    exists\n    errorMessage\n    __typename\n  }\n}",
    })

    return response.data.userNameExists.exists
  }

  private async isGalxeIdExist() {
    const response = await this.request<IsAccountExistResponse>({
      operationName: "GalxeIDExist",
      variables: {
        schema: `EVM:${this.evmClient.signer.address}`,
      },
      query: "query GalxeIDExist($schema: String!) {\n  galxeIdExist(schema: $schema)\n}",
    })

    return response.data.galxeIdExist
  }

  private async createAccount() {
    let username = this.fakeUsername()
    let isUsernameExist = await this.isUsernameExist(username)
    logger.info(`Account ${this.client.name} | Checking if username ${username} exist: ${isUsernameExist}`)

    while (isUsernameExist) {
      username += getRandomNumber(0, 9, true)
      isUsernameExist = await this.isUsernameExist(username)
      logger.info(`Account ${this.client.name} | Checking if username ${username} exist: ${isUsernameExist}`)
    }

    logger.info(`Account ${this.client.name} | Start creating account with name: ${username}`)
    const response = await this.request<CreateNewAccountResponse>({
      operationName: "CreateNewAccount",
      variables: {
        input: {
          schema: `EVM:${this.evmClient.signer.address}`,
          socialUsername: username,
          username,
        },
      },
      query: "mutation CreateNewAccount($input: CreateNewAccount!) {\n  createNewAccount(input: $input)\n}",
    })

    return response.data.createNewAccount
  }

  private async signIn() {
    logger.info(`Account ${this.client.name} | Signing in to Galxe`)
    const message = this.getMessage()
    const signature = await this.evmClient.signer.signMessage(message)

    try {
      const resp = await this.request<SignInResponse>({
        operationName: "SignIn",
        query: "mutation SignIn($input: Auth) {\n  signin(input: $input)\n}",
        variables: {
          input: {
            address: this.evmClient.signer.address,
            addressType: "EVM",
            message: message,
            signature: signature,
          },
        },
      })

      if (resp.errors) {
        logger.error(`Account ${this.client.name} | ${resp.errors}`)
        return false
      }

      this.setAuthToken(resp.data.signin)
      return true
    } catch (error) {
      return false
    }

  }

  async login() {
    const isGalxeIdExist = await this.isGalxeIdExist()
    await this.signIn()

    if (!isGalxeIdExist) {
      await this.createAccount()
    }

    await this.getAccountInfo()
  }

  async getAccountInfo() {
    if (!this.token) await this.login()

    return this.request<AccountInfoResponse>({
      operationName: "BasicUserInfo",
      variables: {
        address: `EVM:${this.evmClient.signer.address}`,
      },
      query:
        "query BasicUserInfo($address: String!) {\n  addressInfo(address: $address) {\n    id\n    username\n    avatar\n    address\n    evmAddressSecondary {\n      address\n      __typename\n    }\n    userLevel {\n      level {\n        name\n        logo\n        minExp\n        maxExp\n        value\n        __typename\n      }\n      exp\n      gold\n      __typename\n    }\n    hasEmail\n    solanaAddress\n    aptosAddress\n    seiAddress\n    injectiveAddress\n    flowAddress\n    starknetAddress\n    bitcoinAddress\n    suiAddress\n    stacksAddress\n    azeroAddress\n    archwayAddress\n    bitcoinSignetAddress\n    xrplAddress\n    algorandAddress\n    tonAddress\n    hasEvmAddress\n    hasSolanaAddress\n    hasAptosAddress\n    hasInjectiveAddress\n    hasFlowAddress\n    hasStarknetAddress\n    hasBitcoinAddress\n    hasSuiAddress\n    hasStacksAddress\n    hasAzeroAddress\n    hasArchwayAddress\n    hasBitcoinSignetAddress\n    hasXrplAddress\n    hasAlgorandAddress\n    hasTonAddress\n    hasTwitter\n    hasGithub\n    hasDiscord\n    hasTelegram\n    hasWorldcoin\n    displayEmail\n    displayTwitter\n    displayGithub\n    displayDiscord\n    displayTelegram\n    displayWorldcoin\n    displayNamePref\n    email\n    twitterUserID\n    twitterUserName\n    githubUserID\n    githubUserName\n    discordUserID\n    discordUserName\n    telegramUserID\n    telegramUserName\n    worldcoinID\n    enableEmailSubs\n    subscriptions\n    isWhitelisted\n    isInvited\n    isAdmin\n    accessToken\n    __typename\n  }\n}",
    })
  }

  async getInfoAboutCampaign(campaignId: string) {
    if (!this.token) await this.login()

    return this.request<CampaignResponse>({
      operationName: "CampaignDetailAll",
      query:
        "query CampaignDetailAll($id: ID!, $address: String!, $withAddress: Boolean!) {\n  campaign(id: $id) {\n    ...CampaignForSiblingSlide\n    coHostSpaces {\n      ...SpaceDetail\n      isAdmin(address: $address) @include(if: $withAddress)\n      isFollowing @include(if: $withAddress)\n      followersCount\n      categories\n      __typename\n    }\n    bannerUrl\n    ...CampaignDetailFrag\n    userParticipants(address: $address, first: 1) @include(if: $withAddress) {\n      list {\n        status\n        premintTo\n        __typename\n      }\n      __typename\n    }\n    space {\n      ...SpaceDetail\n      isAdmin(address: $address) @include(if: $withAddress)\n      isFollowing @include(if: $withAddress)\n      followersCount\n      categories\n      __typename\n    }\n    isBookmarked(address: $address) @include(if: $withAddress)\n    inWatchList\n    claimedLoyaltyPoints(address: $address) @include(if: $withAddress)\n    parentCampaign {\n      id\n      isSequencial\n      thumbnail\n      __typename\n    }\n    isSequencial\n    numNFTMinted\n    childrenCampaigns {\n      ...ChildrenCampaignsForCampaignDetailAll\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment CampaignDetailFrag on Campaign {\n  id\n  ...CampaignMedia\n  ...CampaignForgePage\n  ...CampaignForCampaignParticipantsBox\n  name\n  numberID\n  type\n  inWatchList\n  cap\n  info\n  useCred\n  smartbalancePreCheck(mintCount: 1)\n  smartbalanceDeposited\n  formula\n  status\n  seoImage\n  creator\n  tags\n  thumbnail\n  gasType\n  isPrivate\n  createdAt\n  requirementInfo\n  description\n  enableWhitelist\n  chain\n  startTime\n  endTime\n  requireEmail\n  requireUsername\n  blacklistCountryCodes\n  whitelistRegions\n  rewardType\n  distributionType\n  rewardName\n  claimEndTime\n  loyaltyPoints\n  tokenRewardContract {\n    id\n    address\n    chain\n    __typename\n  }\n  tokenReward {\n    userTokenAmount\n    tokenAddress\n    depositedTokenAmount\n    tokenRewardId\n    tokenDecimal\n    tokenLogo\n    tokenSymbol\n    __typename\n  }\n  nftHolderSnapshot {\n    holderSnapshotBlock\n    __typename\n  }\n  spaceStation {\n    id\n    address\n    chain\n    __typename\n  }\n  ...WhitelistInfoFrag\n  ...WhitelistSubgraphFrag\n  gamification {\n    ...GamificationDetailFrag\n    __typename\n  }\n  creds {\n    id\n    name\n    type\n    credType\n    credSource\n    referenceLink\n    description\n    lastUpdate\n    lastSync\n    syncStatus\n    credContractNFTHolder {\n      timestamp\n      __typename\n    }\n    chain\n    eligible(address: $address, campaignId: $id)\n    subgraph {\n      endpoint\n      query\n      expression\n      __typename\n    }\n    dimensionConfig\n    value {\n      gitcoinPassport {\n        score\n        lastScoreTimestamp\n        __typename\n      }\n      __typename\n    }\n    commonInfo {\n      participateEndTime\n      modificationInfo\n      __typename\n    }\n    __typename\n  }\n  credentialGroups(address: $address) {\n    ...CredentialGroupForAddress\n    __typename\n  }\n  rewardInfo {\n    discordRole {\n      guildId\n      guildName\n      roleId\n      roleName\n      inviteLink\n      __typename\n    }\n    premint {\n      startTime\n      endTime\n      chain\n      price\n      totalSupply\n      contractAddress\n      banner\n      __typename\n    }\n    loyaltyPoints {\n      points\n      __typename\n    }\n    loyaltyPointsMysteryBox {\n      points\n      weight\n      __typename\n    }\n    __typename\n  }\n  participants {\n    participantsCount\n    bountyWinnersCount\n    __typename\n  }\n  taskConfig(address: $address) {\n    participateCondition {\n      conditions {\n        ...ExpressionEntity\n        __typename\n      }\n      conditionalFormula\n      eligible\n      __typename\n    }\n    rewardConfigs {\n      id\n      conditions {\n        ...ExpressionEntity\n        __typename\n      }\n      conditionalFormula\n      description\n      rewards {\n        ...ExpressionReward\n        __typename\n      }\n      eligible\n      rewardAttrVals {\n        attrName\n        attrTitle\n        attrVal\n        __typename\n      }\n      __typename\n    }\n    referralConfig {\n      id\n      conditions {\n        ...ExpressionEntity\n        __typename\n      }\n      conditionalFormula\n      description\n      rewards {\n        ...ExpressionReward\n        __typename\n      }\n      eligible\n      rewardAttrVals {\n        attrName\n        attrTitle\n        attrVal\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  referralCode(address: $address)\n  recurringType\n  latestRecurringTime\n  nftTemplates {\n    id\n    image\n    treasureBack\n    __typename\n  }\n  __typename\n}\n\nfragment CampaignMedia on Campaign {\n  thumbnail\n  rewardName\n  type\n  gamification {\n    id\n    type\n    __typename\n  }\n  __typename\n}\n\nfragment CredentialGroupForAddress on CredentialGroup {\n  id\n  description\n  credentials {\n    ...CredForAddressWithoutMetadata\n    __typename\n  }\n  conditionRelation\n  conditions {\n    expression\n    eligible\n    ...CredentialGroupConditionForVerifyButton\n    __typename\n  }\n  rewards {\n    expression\n    eligible\n    rewardCount\n    rewardType\n    __typename\n  }\n  rewardAttrVals {\n    attrName\n    attrTitle\n    attrVal\n    __typename\n  }\n  claimedLoyaltyPoints\n  __typename\n}\n\nfragment CredForAddressWithoutMetadata on Cred {\n  id\n  name\n  type\n  credType\n  credSource\n  referenceLink\n  description\n  lastUpdate\n  lastSync\n  syncStatus\n  credContractNFTHolder {\n    timestamp\n    __typename\n  }\n  chain\n  eligible(address: $address)\n  subgraph {\n    endpoint\n    query\n    expression\n    __typename\n  }\n  dimensionConfig\n  value {\n    gitcoinPassport {\n      score\n      lastScoreTimestamp\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment CredentialGroupConditionForVerifyButton on CredentialGroupCondition {\n  expression\n  eligibleAddress\n  __typename\n}\n\nfragment WhitelistInfoFrag on Campaign {\n  id\n  whitelistInfo(address: $address) {\n    address\n    maxCount\n    usedCount\n    claimedLoyaltyPoints\n    currentPeriodClaimedLoyaltyPoints\n    currentPeriodMaxLoyaltyPoints\n    __typename\n  }\n  __typename\n}\n\nfragment WhitelistSubgraphFrag on Campaign {\n  id\n  whitelistSubgraph {\n    query\n    endpoint\n    expression\n    variable\n    __typename\n  }\n  __typename\n}\n\nfragment GamificationDetailFrag on Gamification {\n  id\n  type\n  nfts {\n    nft {\n      id\n      animationURL\n      category\n      powah\n      image\n      name\n      treasureBack\n      nftCore {\n        ...NftCoreInfoFrag\n        __typename\n      }\n      traits {\n        name\n        value\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n    forgeConfig {\n    minNFTCount\n    maxNFTCount\n    requiredNFTs {\n      nft {\n        category\n        powah\n        image\n        name\n        nftCore {\n          capable\n          contractAddress\n          __typename\n        }\n        __typename\n      }\n      count\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment NftCoreInfoFrag on NFTCore {\n  id\n  capable\n  chain\n  contractAddress\n  name\n  symbol\n  dao {\n    id\n    name\n    logo\n    alias\n    __typename\n  }\n  __typename\n}\n\nfragment ExpressionEntity on ExprEntity {\n  cred {\n    id\n    name\n    type\n    credType\n    credSource\n    dimensionConfig\n    referenceLink\n    description\n    lastUpdate\n    lastSync\n    chain\n    eligible(address: $address)\n    metadata {\n      visitLink {\n        link\n        __typename\n      }\n      twitter {\n        isAuthentic\n        __typename\n      }\n      __typename\n    }\n    commonInfo {\n      participateEndTime\n      modificationInfo\n      __typename\n    }\n    __typename\n  }\n  attrs {\n    attrName\n    operatorSymbol\n    targetValue\n    __typename\n  }\n  attrFormula\n  eligible\n  eligibleAddress\n  __typename\n}\n\nfragment ExpressionReward on ExprReward {\n  arithmetics {\n    ...ExpressionEntity\n    __typename\n  }\n  arithmeticFormula\n  rewardType\n  rewardCount\n  rewardVal\n  __typename\n}\n\nfragment CampaignForgePage on Campaign {\n  id\n  numberID\n  chain\n  spaceStation {\n    address\n    __typename\n  }\n  gamification {\n    forgeConfig {\n      maxNFTCount\n      minNFTCount\n      requiredNFTs {\n        nft {\n          category\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment CampaignForCampaignParticipantsBox on Campaign {\n  ...CampaignForParticipantsDialog\n  id\n  chain\n  space {\n    id\n    isAdmin(address: $address)\n    __typename\n  }\n  participants {\n    participants(first: 10, after: \"-1\", download: false) {\n      list {\n        address {\n          id\n          avatar\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    participantsCount\n    bountyWinners(first: 10, after: \"-1\", download: false) {\n      list {\n        createdTime\n        address {\n          id\n          avatar\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    bountyWinnersCount\n    __typename\n  }\n  __typename\n}\n\nfragment CampaignForParticipantsDialog on Campaign {\n  id\n  name\n  type\n  rewardType\n  chain\n  nftHolderSnapshot {\n    holderSnapshotBlock\n    __typename\n  }\n  space {\n    isAdmin(address: $address)\n    __typename\n  }\n  rewardInfo {\n    discordRole {\n      guildName\n      roleName\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment SpaceDetail on Space {\n  id\n  name\n  info\n  thumbnail\n  alias\n  status\n  links\n  isVerified\n  discordGuildID\n  followersCount\n  nftCores(input: {first: 1}) {\n    list {\n      id\n      marketLink\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment ChildrenCampaignsForCampaignDetailAll on Campaign {\n  space {\n    ...SpaceDetail\n    isAdmin(address: $address) @include(if: $withAddress)\n    isFollowing @include(if: $withAddress)\n    followersCount\n    categories\n    __typename\n  }\n  ...CampaignDetailFrag\n  claimedLoyaltyPoints(address: $address) @include(if: $withAddress)\n  userParticipants(address: $address, first: 1) @include(if: $withAddress) {\n    list {\n      status\n      __typename\n    }\n    __typename\n  }\n  parentCampaign {\n    id\n    isSequencial\n    __typename\n  }\n  __typename\n}\n\nfragment CampaignForSiblingSlide on Campaign {\n  id\n  space {\n    id\n    alias\n    __typename\n  }\n  parentCampaign {\n    id\n    thumbnail\n    isSequencial\n    childrenCampaigns {\n      id\n      ...CampaignForGetImage\n      ...CampaignForCheckFinish\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment CampaignForCheckFinish on Campaign {\n  claimedLoyaltyPoints(address: $address)\n  whitelistInfo(address: $address) {\n    usedCount\n    __typename\n  }\n  __typename\n}\n\nfragment CampaignForGetImage on Campaign {\n  ...GetImageCommon\n  nftTemplates {\n    image\n    __typename\n  }\n  __typename\n}\n\nfragment GetImageCommon on Campaign {\n  ...CampaignForTokenObject\n  id\n  type\n  thumbnail\n  __typename\n}\n\nfragment CampaignForTokenObject on Campaign {\n  tokenReward {\n    tokenAddress\n    tokenSymbol\n    tokenDecimal\n    tokenLogo\n    __typename\n  }\n  tokenRewardContract {\n    id\n    chain\n    __typename\n  }\n  __typename\n}\n",
      variables: {
        address: this.evmClient.signer.address,
        id: campaignId,
        withAddress: true,
      },
    })
  }

  private async completeGalxeIdTask(campaignId: string, cred: Cred) {
    switch (cred.type) {
    case "VISIT_LINK":
      return true
    }

    return false
  }

  private isParentCampaign(campaign: CampaignType) {
    return campaign.type === "Parent"
  }

  private isDailyCampaign(campaign: CampaignType) {
    return campaign.recurringType === "DAILY"
  }

  private isDailyPointsClaimed(campaign: CampaignType) {
    if (!this.isDailyCampaign(campaign) || this.isParentCampaign(campaign)) {
      return true
    }

    if (campaign.whitelistInfo.currentPeriodClaimedLoyaltyPoints < campaign.whitelistInfo.currentPeriodMaxLoyaltyPoints) {
      return false
    }

    if (campaign.whitelistInfo.currentPeriodMaxLoyaltyPoints > 0) {
      return true
    }

    return campaign.credentialGroups.every(group => group.claimedLoyaltyPoints > 0)
  }

  private isCampaignPointsClaimed(campaign: CampaignType) {
    return campaign.whitelistInfo.currentPeriodClaimedLoyaltyPoints >= campaign.whitelistInfo.currentPeriodMaxLoyaltyPoints &&
           campaign.claimedLoyaltyPoints >= campaign.loyaltyPoints &&
           this.isDailyPointsClaimed(campaign)
  }

  isAlreadyClaimed(campaign: CampaignType) {
    const gamificationType = Galxe.getGamificationType(campaign)

    if (!gamificationType) return true

    switch (gamificationType) {
    case "Points":
      return this.isCampaignPointsClaimed(campaign)
    }
  }

  async handleVisitPageTask({ taskId, campaignId }: { taskId: string; campaignId: string }) {
    if (!this.token) await this.login()

    logger.info(`Account ${this.client.name} | Start task ${taskId}`)
    const solution = await solverGeeTestCaptcha({ accountName: this.client.name, ua: this.userAgent, proxy: this.proxy })

    if (!solution || !("solution" in solution)) return null

    try {
      this.request({
        operationName: "AddTypedCredentialItems",
        variables: {
          input: {
            credId: taskId,
            campaignId: campaignId,
            operation: "APPEND",
            items: [`EVM:${this.evmClient.signer.address}`],
            captcha: {
              lotNumber: solution.lot_number,
              captchaOutput: solution.captcha_output,
              passToken: solution.pass_token,
              genTime: solution.gen_time,
            },
          },
        },
        query:
          "mutation AddTypedCredentialItems($input: MutateTypedCredItemInput!) {\n  typedCredentialItems(input: $input) {\n    id\n    __typename\n  }\n}",
      })

      logger.success(`Account ${this.client.name} | Succsesfully completed task ${taskId}`)
    } catch (error) {
      logger.error(`Account ${this.client.name} | Error while task ${taskId}\n ${error}`)
    }
  }

  async claimTask(taskId: string) {
    if (!this.token) await this.login()

    logger.info(`Account ${this.client.name} | Start claim task ${taskId}`)

    try {
      this.request({
        operationName: "SyncCredentialValue",
        variables: {
          input: {
            syncOptions: {
              credId: taskId,
              address: `EVM:${this.evmClient.signer.address}`,
            },
          },
        },
        query:
          "mutation SyncCredentialValue($input: SyncCredentialValueInput!) {\n  syncCredentialValue(input: $input) {\n    value {\n      address\n      spaceUsers {\n        follow\n        points\n        participations\n        __typename\n      }\n      campaignReferral {\n        count\n        __typename\n      }\n      galxePassport {\n        eligible\n        lastSelfieTimestamp\n        __typename\n      }\n      gitcoinPassport {\n        score\n        lastScoreTimestamp\n        __typename\n      }\n      walletBalance {\n        balance\n        __typename\n      }\n      multiDimension {\n        value\n        __typename\n      }\n      allow\n      survey {\n        answers\n        __typename\n      }\n      quiz {\n        allow\n        correct\n        __typename\n      }\n      __typename\n    }\n    message\n    __typename\n  }\n}",
      })

      logger.success(`Account ${this.client.name} | Succsesfully claimed task ${taskId}`)
    }
    catch (error) {
      logger.error(`Account ${this.client.name} | Error while claim task ${taskId}\n ${error}`)
    }
  }
}

export { Galxe }
