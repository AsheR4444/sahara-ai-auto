import axios, { AxiosInstance, AxiosProxyConfig } from "axios"

import { CreateTweetResponse } from "./types"

const getHeaders = () => ({
  "accept": "*/*",
  "accept-language": "en-US,en;q=0.6",
  "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
  "cache-control": "no-cache",
  "content-type": "application/json",
  "origin": "https://x.com",
  "pragma": "no-cache",
  "priority": "u=1, i",
  "referer": "https://x.com/compose/post",
  "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Brave\";v=\"133\", \"Chromium\";v=\"133\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "sec-gpc": "1",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "x-client-transaction-id": "XCDfv32zjUCY+MOocCuALbZq/fnwjoX4ev+hZfxt2pcDLoYribL/urYgsKN0yI+k9QtxAV8qqR2Z6KB+b+AobmW6MVirXw",
  "x-client-uuid": "b27bf305-766c-417c-b5c0-93183fb322df",
  "x-csrf-token": "592750d3114c68d0cf23d1d89c2cc14d990ebf7ce2016bb411f30c7ac7c4afc1eca4373135feb488c0b55027296e583abbf97af267584dc4d52d1f87d405f6f3815e7d05433c56874ade7285dd9eca1a",
  "x-twitter-active-user": "yes",
  "x-twitter-auth-type": "OAuth2Session",
  "x-twitter-client-language": "en",
})

const FEATURES = {
  "premium_content_api_read_enabled": false,
  "communities_web_enable_tweet_community_results_fetch": true,
  "c9s_tweet_anatomy_moderator_badge_enabled": true,
  "responsive_web_grok_analyze_button_fetch_trends_enabled": false,
  "responsive_web_grok_analyze_post_followups_enabled": true,
  "responsive_web_jetfuel_frame": false,
  "responsive_web_grok_share_attachment_enabled": true,
  "responsive_web_edit_tweet_api_enabled": true,
  "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
  "view_counts_everywhere_api_enabled": true,
  "longform_notetweets_consumption_enabled": true,
  "responsive_web_twitter_article_tweet_consumption_enabled": true,
  "tweet_awards_web_tipping_enabled": false,
  "responsive_web_grok_analysis_button_from_backend": true,
  "creator_subscriptions_quote_tweet_preview_enabled": false,
  "longform_notetweets_rich_text_read_enabled": true,
  "longform_notetweets_inline_media_enabled": true,
  "profile_label_improvements_pcf_label_in_post_enabled": true,
  "rweb_tipjar_consumption_enabled": true,
  "responsive_web_graphql_exclude_directive_enabled": true,
  "verified_phone_label_enabled": false,
  "articles_preview_enabled": true,
  "rweb_video_timestamps_enabled": true,
  "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
  "freedom_of_speech_not_reach_fetch_enabled": true,
  "standardized_nudges_misinfo": true,
  "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
  "responsive_web_grok_image_annotation_enabled": true,
  "responsive_web_graphql_timeline_navigation_enabled": true,
  "responsive_web_enhance_cards_enabled": false,
}

class Twitter {
  private session: AxiosInstance
  private readonly COOKIES_DOMAIN = ".twitter.com"

  proxy?: AxiosProxyConfig | null = null
  authToken: string | null = null
  ct0: string | null = null

  constructor({ proxy, authToken, ct0 }: { proxy?: AxiosProxyConfig | null, authToken: string, ct0: string }) {
    this.session = axios.create({
      headers: {
        ...getHeaders(),
      },
    })

    this.proxy = proxy
    this.authToken = authToken
    this.ct0 = ct0
  }

  private async getCt0() {
    const response = await this.session.get("https://api.x.com/1.1/account/settings.json")

    const cookies = response.headers["set-cookie"]
    console.log(JSON.stringify(response))
  }

  private setCookies(cookies: Record<string, unknown>) {
    const existingCookies = this.session.defaults.headers.cookie as string || ""
    const cookieArray = existingCookies.split("; ").filter(Boolean)

    for (const [name, value] of Object.entries(cookies)) {
      const cookieIndex = cookieArray.findIndex(cookie => cookie.startsWith(`${name}=`))
      if (cookieIndex !== -1) {
        cookieArray.splice(cookieIndex, 1)
      }
      cookieArray.push(`${name}=${value}`)
    }

    this.session.defaults.headers.cookie = cookieArray.join("; ")
  }

  async start() {
    this.setCookies({ "auth_token": this.authToken, "ct0": this.ct0 })

    /* if (!this.ct0) {
      await this.getCt0()
    } */
  }

  async tweet(text: string) {
    const response = await this.session.post<CreateTweetResponse>(
      "https://x.com/i/api/graphql/UYy4T67XpYXgWKOafKXB_A/CreateTweet",
      {
        variables: {
          tweet_text: text,
          dark_request: false,
          media: {
            media_entities: [],
            possibly_sensitive: false,
          },
          semantic_annotation_ids: [],
          disallowed_reply_options: null,
        },
        features: FEATURES,
        queryId: "UYy4T67XpYXgWKOafKXB_A",
      },
    )

    const name = response.data.data.create_tweet.tweet_results.result.core.user_results.result.legacy.screen_name

    return `https://x.com/${name}/status/${response.data.data.create_tweet.tweet_results.result.rest_id}`
  }
}

export { Twitter }
