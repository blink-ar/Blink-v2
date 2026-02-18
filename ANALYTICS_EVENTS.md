# GA Event Dictionary

Last updated: 2026-02-17

Maintenance rule:
- Any change to analytics event names or params in `/Users/tomas/Dev/Blink/Blink-v2/src/analytics/googleAnalytics.ts` or `/Users/tomas/Dev/Blink/Blink-v2/src/analytics/intentTracking.ts` must update this file in the same PR.

## Configuration
- Measurement ID env var: `VITE_GA_MEASUREMENT_ID`
- Init point: `/Users/tomas/Dev/Blink/Blink-v2/src/components/analytics/AnalyticsTracker.tsx`
- Router page view tracking: `trackPageView(path)`

## Global Events (Auto)

### `page_view`
Params:
- `page_path`
- `page_title`
- `page_location`

### DOM interaction events
Event names:
- `click`
- `dblclick`
- `contextmenu`
- `submit`
- `change`
- `input` (throttled 1s per element key)
- `focusin`
- `focusout`
- `keydown`
- `keyup`
- `pointerdown`
- `pointerup`
- `touchstart`
- `touchend`
- `copy`
- `cut`
- `paste`

Common params:
- `page_path`
- `viewport_width`
- `viewport_height`
- `element_tag`
- `element_id`
- `element_role`
- `element_name`
- `element_type`
- `element_classes`
- `element_label`
- `link_path`
- `form_action` (submit/form-related)
- `form_method` (submit/form-related)
- `form_id` (submit/form-related)
- `keyboard_key` (keyboard events)
- `keyboard_ctrl` (keyboard events)
- `keyboard_shift` (keyboard events)
- `keyboard_alt` (keyboard events)
- `keyboard_meta` (keyboard events)
- `event_is_trusted`

### `scroll_depth`
Params:
- `page_path`
- `viewport_width`
- `viewport_height`
- `scroll_depth_percent` (25, 50, 75, 100)

### `window_resize`
Params:
- `page_path`
- `viewport_width`
- `viewport_height`

### `visibility_change`
Params:
- `page_path`
- `viewport_width`
- `viewport_height`
- `visibility_state`

### `runtime_error`
Params:
- `page_path`
- `viewport_width`
- `viewport_height`
- `error_message`
- `error_filename`
- `error_line`
- `error_col`

### `unhandled_rejection`
Params:
- `page_path`
- `viewport_width`
- `viewport_height`
- `error_message`

## Intent Events (Semantic)

### `search`
Params:
- `source`
- `search_term`
- `results_count`
- `has_filters`
- `active_filter_count`
- `category`

Current sources:
- `home_hero_search`
- `search_page`
- `map_page`

### `filter_apply`
Params:
- `source`
- `filter_type`
- `filter_value`
- `active_filter_count`

Current `filter_type` values:
- `category`
- `bank`
- `online`
- `distance`
- `discount`
- `day`
- `card_mode`
- `network`
- `installments`

Current sources:
- `home_quick_pill`
- `home_category_marquee`
- `search_filters`
- `map_filters`
- `map_filters_single_business`

### `map_interaction`
Params:
- `source`
- `action`
- `zoom_level`
- `business_id`

Current `action` values:
- `open_map`
- `marker_click`
- `map_click`
- `pan`
- `zoom`
- `recenter_user_location`
- `list_select`

Current sources:
- `search_page`
- `map_page`
- `map_page_single_business`

### `select_business`
Params:
- `source`
- `business_id`
- `category`
- `position`

Current sources:
- `search_results`
- `map_marker`
- `map_list`
- `map_list_open_business`
- `business_detail_page`

### `view_benefit`
Params:
- `source`
- `benefit_id`
- `business_id`
- `category`
- `position`

Current sources:
- `home_top5`
- `business_detail_benefit_list`
- `benefit_detail_page`

### `start_navigation`
Params:
- `source`
- `destination_business_id`
- `provider`

Current sources:
- `business_detail_page`
- `benefit_detail_page`

Current `provider` values:
- `in_app_map`

### `share_benefit`
Params:
- `source`
- `benefit_id`
- `business_id`
- `channel`

Current sources:
- `benefit_detail_page`

Current `channel` values:
- `web_share`
- `clipboard`
- `unsupported`
- `dismissed`
- `share_error`

### `save_benefit`
Params:
- `source`
- `benefit_id`
- `business_id`

Current sources:
- `benefit_detail_page`

### `unsave_benefit`
Params:
- `source`
- `benefit_id`
- `business_id`

Current sources:
- `benefit_detail_page`

### `no_results`
Params:
- `source`
- `search_term`
- `active_filter_count`
- `category`

Current sources:
- `search_page`
- `map_page`
- `map_page_single_business`

## Normalization Rules (applies to all events)
- Event names are normalized to snake_case.
- Param keys are normalized to snake_case.
- String param values are truncated to max 100 chars.
- Undefined params are dropped before sending.
