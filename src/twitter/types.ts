export type TwitterUserLegacy = {
  following: boolean
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: {
    description: {
      urls: any[]
    }
  }
  fast_followers_count: number
  favourites_count: number
  followers_count: number
  friends_count: number
  has_custom_timelines: boolean
  is_translator: boolean
  listed_count: number
  location: string
  media_count: number
  name: string
  needs_phone_verification: boolean
  normal_followers_count: number
  pinned_tweet_ids_str: string[]
  possibly_sensitive: boolean
  profile_banner_url: string
  profile_image_url_https: string
  profile_interstitial_type: string
  screen_name: string
  statuses_count: number
  translator_type: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: string[]
}

export type TwitterUser = {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: Record<string, unknown>
  has_graduated_access: boolean
  parody_commentary_fan_label: string
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: TwitterUserLegacy
  tipjar_settings: Record<string, unknown>
}

export type TweetLegacy = {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: {
    hashtags: any[]
    symbols: any[]
    timestamps: any[]
    urls: any[]
    user_mentions: any[]
  }
  favorite_count: number
  favorited: boolean
  full_text: string
  is_quote_status: boolean
  lang: string
  quote_count: number
  reply_count: number
  retweet_count: number
  retweeted: boolean
  user_id_str: string
  id_str: string
}

export type Tweet = {
  rest_id: string
  core: {
    user_results: {
      result: TwitterUser
    }
  }
  unmention_data: Record<string, unknown>
  edit_control: {
    edit_tweet_ids: string[]
    editable_until_msecs: string
    is_edit_eligible: boolean
    edits_remaining: string
  }
  is_translatable: boolean
  views: {
    state: string
  }
  source: string
  grok_analysis_button: boolean
  legacy: TweetLegacy
  unmention_info: Record<string, unknown>
}

export type CreateTweetResponse = {
  data: {
    create_tweet: {
      tweet_results: {
        result: Tweet
      }
    }
  }
  errors: any[]
  includes: {
    users: TwitterUser[]
    tweets: Tweet[]
  }
}
